from __future__ import annotations

from typing import Optional, Sequence, Tuple, List

from datetime import date

from sqlalchemy import select, func, delete
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.data_sync import DataSyncRecord, DataType
from app.models.raw_product_list import RawProductList
from app.models.raw_income_log import RawIncomeLog
from app.models.income_transaction import IncomeTransaction
from app.services.data_sync_developer_service import DataSyncDeveloperService
from app.services.data_sync_imvu_user_service import DataSyncImvuUserService
from app.services.data_sync_product_service import DataSyncProductService
from app.services.data_sync_income_service import DataSyncIncomeService


class DataSyncService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.developer_service = DataSyncDeveloperService(session)
        self.imvu_user_service = DataSyncImvuUserService(session)
        self.product_service = DataSyncProductService(session)
        self.income_service = DataSyncIncomeService(session)
        

    async def get_by_hash(self, hash_value: str, user_id: Optional[int] = None) -> Optional[DataSyncRecord]:
        stmt = select(DataSyncRecord).where(DataSyncRecord.hash == hash_value).order_by(DataSyncRecord.uploaded_at.desc())
        if user_id is not None:
            stmt = stmt.where(DataSyncRecord.user_id == user_id)
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
        user_id: int,
    ) -> DataSyncRecord:
        record = DataSyncRecord(
            type=type,
            filename=filename,
            hash=hash,
            record_count=record_count,
            file_size=file_size,
            content=content,
            user_id=user_id,
        )
        self.session.add(record)
        await self.session.commit()
        await self.session.refresh(record)
        return record

    async def delete(self, record_id: int, user_id: Optional[int] = None) -> bool:
        stmt = select(DataSyncRecord).where(DataSyncRecord.id == record_id)
        if user_id is not None:
            stmt = stmt.where(DataSyncRecord.user_id == user_id)
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
        user_id: Optional[int] = None,
    ) -> Tuple[Sequence[DataSyncRecord], int]:
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 20

        base_q = select(DataSyncRecord)
        count_q = select(func.count()).select_from(DataSyncRecord)
        if user_id is not None:
            base_q = base_q.where(DataSyncRecord.user_id == user_id)
            count_q = count_q.where(DataSyncRecord.user_id == user_id)
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

            await self.developer_service.ensure_developers_and_users(developer_ids=developer_ids, snapshot_date=snapshot_date)
            await self.product_service.upsert_products(product_ids=product_ids, records=records)

            # Commit any created/updated developer/user/product rows
            await self.session.commit()
        except Exception:
            # best-effort: log/ignore here; do not fail the raw insertion
            await self.session.rollback()

        return len(objs)

    async def delete_raw_by_sync_record(self, sync_record_id: int) -> int:
        """Delete raw_product_list rows by sync_record_id. Returns number of rows deleted."""
        stmt = delete(RawProductList).where(RawProductList.sync_record_id == sync_record_id)
        res = await self.session.execute(stmt)
        await self.session.commit()
        # rowcount may be None in some backends; coerce to int
        return int(res.rowcount or 0)

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
            await self.developer_service.ensure_developers_and_users(developer_ids=developer_ids, snapshot_date=snapshot_date)

            # collect user id -> name map from income records
            user_id_name_map = self.imvu_user_service.collect_income_user_map(records)
            await self.imvu_user_service.ensure_imvu_users_from_map(user_id_name_map=user_id_name_map, snapshot_date=snapshot_date)

            # upsert products based on income records
            await self.product_service.ensure_products_from_income(product_ids=product_ids, records=records, snapshot_date=snapshot_date)

            # create income_transaction rows from raw records via dedicated service
            await self.income_service.create_transactions_from_records(records)

            # Commit any created/updated developer/user/product rows and derived transactions
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

