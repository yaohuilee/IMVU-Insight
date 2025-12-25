from __future__ import annotations

from typing import Optional, Sequence, Tuple, List

from datetime import date

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.data_sync import DataSyncRecord, DataType
from app.models.raw_product_list import RawProductList
from app.models.raw_income_log import RawIncomeLog
from app.models.product import Product
from app.models.developer import Developer
from app.models.imvu_user import ImvuUser
from decimal import Decimal, InvalidOperation
from datetime import datetime, time


class DataSyncService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_hash(self, hash_value: str) -> Optional[DataSyncRecord]:
        stmt = select(DataSyncRecord).where(DataSyncRecord.hash == hash_value).order_by(DataSyncRecord.uploaded_at.desc())
        res = await self.session.execute(stmt)
        return res.scalars().first()

    async def create(
        self,
        *,
        type: DataType,
        filename: str,
        hash: str,
        record_count: int,
        file_size: int,
        content: bytes,
    ) -> DataSyncRecord:
        record = DataSyncRecord(
            type=type,
            filename=filename,
            hash=hash,
            record_count=record_count,
            file_size=file_size,
            content=content,
        )
        self.session.add(record)
        await self.session.commit()
        await self.session.refresh(record)
        return record

    async def delete(self, record_id: int) -> bool:
        stmt = select(DataSyncRecord).where(DataSyncRecord.id == record_id)
        res = await self.session.execute(stmt)
        record = res.scalar_one_or_none()
        if record is None:
            return False
        await self.session.delete(record)
        await self.session.commit()
        return True

    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        type: Optional[DataType] = None,
    ) -> Tuple[Sequence[DataSyncRecord], int]:
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 20

        base_q = select(DataSyncRecord)
        count_q = select(func.count()).select_from(DataSyncRecord)
        if type is not None:
            base_q = base_q.where(DataSyncRecord.type == type)
            count_q = count_q.where(DataSyncRecord.type == type)

        base_q = base_q.order_by(DataSyncRecord.uploaded_at.desc())

        total_res = await self.session.execute(count_q)
        total = int(total_res.scalar_one() or 0)

        offset = (page - 1) * page_size
        page_res = await self.session.execute(base_q.offset(offset).limit(page_size))
        records = page_res.scalars().all()
        return records, total

    async def add_raw_product_list(self, *, sync_record_id: int, snapshot_date: date, records: Sequence[dict]) -> int:
        """Bulk insert raw product list rows for a given sync record and snapshot date.

        `records` should be an iterable of dicts with keys matching the XML fields:
        product_id, product_name, price, profit, visible, old_sales, new_sales,
        total_sales, derived_product_sales, direct_sales, indirect_sales,
        promoted_sales, cart_adds, wishlist_adds, organic_impressions, paid_impressions
        """
        objs: List[RawProductList] = []
        for r in records:
            obj = RawProductList(
                sync_record_id=sync_record_id,
                snapshot_date=snapshot_date,
                developer_id=r.get("developer_id"),
                product_id=r.get("product_id"),
                product_name=r.get("product_name", ""),
                price=r.get("price", ""),
                profit=r.get("profit", ""),
                visible=r.get("visible", ""),
                old_sales=r.get("old_sales", ""),
                new_sales=r.get("new_sales", ""),
                total_sales=r.get("total_sales", ""),
                derived_product_sales=r.get("derived_product_sales", ""),
                direct_sales=r.get("direct_sales", ""),
                indirect_sales=r.get("indirect_sales", ""),
                promoted_sales=r.get("promoted_sales", ""),
                cart_adds=r.get("cart_adds", ""),
                wishlist_adds=r.get("wishlist_adds", ""),
                organic_impressions=r.get("organic_impressions", ""),
                paid_impressions=r.get("paid_impressions", ""),
            )
            objs.append(obj)

        if not objs:
            return 0

        self.session.add_all(objs)
        await self.session.commit()

        # After inserting raw rows, ensure developer/imvu_user and product records.
        try:
            developer_ids = {r.get("developer_id") for r in records if r.get("developer_id") is not None}
            product_ids = {r.get("product_id") for r in records if r.get("product_id") is not None}

            await self._ensure_developers_and_users(developer_ids=developer_ids, snapshot_date=snapshot_date)
            await self._upsert_products(product_ids=product_ids, records=records)

            # Commit any created/updated developer/user/product rows
            await self.session.commit()
        except Exception:
            # best-effort: log/ignore here; do not fail the raw insertion
            await self.session.rollback()

        return len(objs)

    async def _ensure_developers_and_users(self, *, developer_ids: set, snapshot_date: date) -> None:
        """Ensure Developer and ImvuUser rows exist for given developer IDs.

        Adds missing objects to the current session but does not commit.
        """
        if not developer_ids:
            return

        stmt = select(Developer).where(Developer.developer_user_id.in_(developer_ids))
        res = await self.session.execute(stmt)
        existing_devs = {d.developer_user_id for d in res.scalars().all()}
        # use a datetime at midnight for first/last seen timestamps
        snapshot_dt = datetime.combine(snapshot_date, time.min)
        to_create_devs = [
            Developer(developer_user_id=did, first_seen_at=snapshot_dt, last_seen_at=snapshot_dt)
            for did in developer_ids
            if did not in existing_devs
        ]
        if to_create_devs:
            self.session.add_all(to_create_devs)

        # Create missing ImvuUser rows for the same IDs
        stmt2 = select(ImvuUser).where(ImvuUser.user_id.in_(developer_ids))
        res2 = await self.session.execute(stmt2)
        existing_users = {u.user_id for u in res2.scalars().all()}
        to_create_users = [
            ImvuUser(user_id=did, user_name=None, first_seen_at=snapshot_dt, last_seen_at=snapshot_dt)
            for did in developer_ids
            if did not in existing_users
        ]
        if to_create_users:
            self.session.add_all(to_create_users)

    async def _upsert_products(self, *, product_ids: set, records: Sequence[dict]) -> None:
        """Upsert Product rows from raw records. Adds new products or updates existing ones.

        Adds objects to the current session but does not commit.
        """
        if not product_ids:
            return

        resp = await self.session.execute(select(Product).where(Product.product_id.in_(product_ids)))
        existing_products = {p.product_id: p for p in resp.scalars().all()}

        for r in records:
            pid = r.get("product_id")
            if pid is None:
                continue

            name = r.get("product_name", "")
            price_raw = r.get("price", "")
            try:
                price_val = Decimal(price_raw)
            except (InvalidOperation, TypeError):
                try:
                    price_val = Decimal(str(float(price_raw)))
                except Exception:
                    price_val = Decimal("0.00")

            vis_raw = r.get("visible", "")
            visible_bool = str(vis_raw).lower() in ("1", "true", "yes", "y", "t")

            if pid in existing_products:
                prod = existing_products[pid]
                prod.developer_user_id = r.get("developer_id") or prod.developer_user_id
                prod.product_name = name or prod.product_name
                prod.price = price_val
                prod.visible = visible_bool
            else:
                prod = Product(
                    product_id=pid,
                    developer_user_id=r.get("developer_id") or 0,
                    product_name=name,
                    price=price_val,
                    visible=visible_bool,
                )
                self.session.add(prod)

    async def delete_raw_by_sync_record(self, sync_record_id: int) -> int:
        """Delete raw_product_list rows by sync_record_id. Returns number of rows deleted."""
        stmt = delete(RawProductList).where(RawProductList.sync_record_id == sync_record_id)
        res = await self.session.execute(stmt)
        await self.session.commit()
        # rowcount may be None in some backends; coerce to int
        return int(res.rowcount or 0)

    def _collect_income_user_map(self, records: Sequence[dict]) -> dict:
        """Collect a mapping of numeric user_id -> latest available name from income records.

        Reseller IDs may be non-numeric; only numeric IDs are included.
        """
        # Map user_id -> {"name": str, "min_dt": datetime|None, "max_dt": datetime|None}
        user_map: dict[int, dict] = {}
        for r in records:
            purchase_dt = r.get("purchase_date")

            # buyer
            bid = r.get("buyer_id")
            if bid is not None:
                entry = user_map.setdefault(bid, {"name": r.get("buyer_name") or "", "min_dt": None, "max_dt": None})
                if entry["name"] == "" and (r.get("buyer_name") or ""):
                    entry["name"] = r.get("buyer_name") or ""
                if isinstance(purchase_dt, datetime):
                    if entry["min_dt"] is None or purchase_dt < entry["min_dt"]:
                        entry["min_dt"] = purchase_dt
                    if entry["max_dt"] is None or purchase_dt > entry["max_dt"]:
                        entry["max_dt"] = purchase_dt

            # recipient
            rid = r.get("recipient_id")
            if rid is not None:
                entry = user_map.setdefault(rid, {"name": r.get("recipient_name") or "", "min_dt": None, "max_dt": None})
                if entry["name"] == "" and (r.get("recipient_name") or ""):
                    entry["name"] = r.get("recipient_name") or ""
                if isinstance(purchase_dt, datetime):
                    if entry["min_dt"] is None or purchase_dt < entry["min_dt"]:
                        entry["min_dt"] = purchase_dt
                    if entry["max_dt"] is None or purchase_dt > entry["max_dt"]:
                        entry["max_dt"] = purchase_dt

            # reseller (may be non-numeric in raw data)
            res_raw = r.get("reseller_id")
            try:
                resid = int(res_raw) if res_raw is not None and str(res_raw) != "" else None
            except Exception:
                resid = None
            if resid is not None:
                entry = user_map.setdefault(resid, {"name": r.get("reseller_name") or "", "min_dt": None, "max_dt": None})
                if entry["name"] == "" and (r.get("reseller_name") or ""):
                    entry["name"] = r.get("reseller_name") or ""
                if isinstance(purchase_dt, datetime):
                    if entry["min_dt"] is None or purchase_dt < entry["min_dt"]:
                        entry["min_dt"] = purchase_dt
                    if entry["max_dt"] is None or purchase_dt > entry["max_dt"]:
                        entry["max_dt"] = purchase_dt

        return user_map

    async def _ensure_imvu_users_from_map(self, *, user_id_name_map: dict, snapshot_date: date) -> None:
        """Create or update ImvuUser rows for given id->info map.

        `user_id_name_map` is expected to map user_id -> {"name": str, "min_dt": datetime|None, "max_dt": datetime|None}.

        For existing users: if a record has an earlier `min_dt` than `first_seen_at`, update `first_seen_at`.
        If a record has a later `max_dt` than `last_seen_at`, update `last_seen_at` and the `user_name`.

        If no datetimes are available for a user, fall back to the import `snapshot_date` at midnight.
        """
        if not user_id_name_map:
            return

        stmt = select(ImvuUser).where(ImvuUser.user_id.in_(list(user_id_name_map.keys())))
        res = await self.session.execute(stmt)
        existing_users = {u.user_id: u for u in res.scalars().all()}

        snapshot_dt = datetime.combine(snapshot_date, time.min)
        for uid, info in user_id_name_map.items():
            name = info.get("name") or None
            min_dt = info.get("min_dt")
            max_dt = info.get("max_dt")

            # creation fallback times
            create_first = min_dt or snapshot_dt
            create_last = max_dt or snapshot_dt

            if uid in existing_users:
                u = existing_users[uid]
                try:
                    cur_first = u.first_seen_at
                except Exception:
                    cur_first = None
                try:
                    cur_last = u.last_seen_at
                except Exception:
                    cur_last = None

                # Update first_seen_at if we found an earlier time
                if min_dt is not None and (cur_first is None or min_dt < cur_first):
                    u.first_seen_at = min_dt

                # Update last_seen_at and user_name if we found a later time
                if max_dt is not None and (cur_last is None or max_dt > cur_last):
                    u.last_seen_at = max_dt
                    if name:
                        u.user_name = name or u.user_name
            else:
                new_u = ImvuUser(user_id=uid, user_name=name, first_seen_at=create_first, last_seen_at=create_last)
                self.session.add(new_u)

    async def _ensure_products_from_income(self, *, product_ids: set, records: Sequence[dict], snapshot_date: date) -> None:
        """Ensure Product rows exist or are updated from income records.

        Updates `product_name` when the snapshot is newer than `updated_at`. Creates minimal Product rows when missing.
        """
        if not product_ids:
            return

        resp = await self.session.execute(select(Product).where(Product.product_id.in_(product_ids)))
        existing_products = {p.product_id: p for p in resp.scalars().all()}

        for r in records:
            pid = r.get("product_id")
            if pid is None:
                continue

            name = r.get("product_name", "")

            if pid in existing_products:
                prod = existing_products[pid]
                try:
                    prod_updated = prod.updated_at
                except Exception:
                    prod_updated = None
                prod_updated_date = prod_updated.date() if prod_updated is not None else None
                if prod_updated_date is None or snapshot_date >= prod_updated_date:
                    prod.product_name = name or prod.product_name
            else:
                from decimal import Decimal

                prod = Product(
                    product_id=pid,
                    developer_user_id=r.get("developer_id") or 0,
                    product_name=name,
                    price=Decimal("0.00"),
                    visible=False,
                )
                self.session.add(prod)

    async def add_raw_income_log(self, *, sync_record_id: int, snapshot_date: date, records: Sequence[dict]) -> int:
        """Bulk insert raw income log rows for a given sync record and snapshot date.

        `records` should be an iterable of dicts with keys matching the XML fields:
        sales_log_id, buyer_id, buyer_name, recipient_id, recipient_name,
        reseller_id, reseller_name, product_id, product_name, price_factor,
        paid_credits, paid_promo_credits, income_credits, income_promo_credits,
        purchase_date (datetime), credit_delivery_date
        """
        objs: List[RawIncomeLog] = []
        for r in records:
            obj = RawIncomeLog(
                sync_record_id=sync_record_id,
                snapshot_date=snapshot_date,
                developer_id=r.get("developer_id"),
                sales_log_id=r.get("sales_log_id"),
                buyer_id=r.get("buyer_id"),
                buyer_name=r.get("buyer_name", ""),
                recipient_id=r.get("recipient_id"),
                recipient_name=r.get("recipient_name", ""),
                reseller_id=r.get("reseller_id", ""),
                reseller_name=r.get("reseller_name", ""),
                product_id=r.get("product_id"),
                product_name=r.get("product_name", ""),
                price_factor=r.get("price_factor", ""),
                paid_credits=r.get("paid_credits", ""),
                paid_promo_credits=r.get("paid_promo_credits", ""),
                income_credits=r.get("income_credits", ""),
                income_promo_credits=r.get("income_promo_credits", ""),
                purchase_date=r.get("purchase_date"),
                credit_delivery_date=r.get("credit_delivery_date", ""),
            )
            objs.append(obj)

        if not objs:
            return 0

        self.session.add_all(objs)
        await self.session.commit()

        # After inserting raw rows, ensure developer/imvu_user and product records.
        try:
            developer_ids = {r.get("developer_id") for r in records if r.get("developer_id") is not None}
            product_ids = {r.get("product_id") for r in records if r.get("product_id") is not None}

            # collect and ensure developer rows and imvu users for developers
            await self._ensure_developers_and_users(developer_ids=developer_ids, snapshot_date=snapshot_date)

            # collect user id -> name map from income records
            user_id_name_map = self._collect_income_user_map(records)
            await self._ensure_imvu_users_from_map(user_id_name_map=user_id_name_map, snapshot_date=snapshot_date)

            # upsert products based on income records
            await self._ensure_products_from_income(product_ids=product_ids, records=records, snapshot_date=snapshot_date)

            # Commit any created/updated developer/user/product rows
            await self.session.commit()
        except Exception:
            # best-effort: rollback and ignore so raw insertion remains successful
            await self.session.rollback()

        return len(objs)

    async def delete_raw_income_by_sync_record(self, sync_record_id: int) -> int:
        """Delete raw_income_log rows by sync_record_id. Returns number of rows deleted."""
        stmt = delete(RawIncomeLog).where(RawIncomeLog.sync_record_id == sync_record_id)
        res = await self.session.execute(stmt)
        await self.session.commit()
        return int(res.rowcount or 0)

