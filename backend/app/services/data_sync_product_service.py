from __future__ import annotations

from typing import Optional, Sequence, Set, Dict

from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from decimal import Decimal, InvalidOperation


class DataSyncProductService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def upsert_products(self, *, product_ids: Set[int], records: Sequence[Dict]) -> None:
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
                    visible=visible_bool
                )
                self.session.add(prod)

    async def ensure_products_from_income(self, *, product_ids: Set[int], records: Sequence[Dict], snapshot_date: date) -> None:
        """Ensure Product rows exist or are updated from income records.

        Updates `product_name` when the snapshot is newer than `updated_at`. Creates minimal Product rows when missing.
        Also updates `first_sold_at` and `last_sold_at` based on `purchase_date`.
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
            purchase_date = r.get("purchase_date")

            if pid in existing_products:
                prod = existing_products[pid]
                try:
                    prod_updated = prod.updated_at
                except Exception:
                    prod_updated = None
                prod_updated_date = prod_updated.date() if prod_updated is not None else None
                if prod_updated_date is None or snapshot_date >= prod_updated_date:
                    prod.product_name = name or prod.product_name
                # Update first_sold_at and last_sold_at based on purchase_date
                if purchase_date is not None:
                    if prod.first_sold_at is None or purchase_date < prod.first_sold_at:
                        prod.first_sold_at = purchase_date
                    if prod.last_sold_at is None or purchase_date > prod.last_sold_at:
                        prod.last_sold_at = purchase_date
            else:
                if purchase_date is not None:
                    prod = Product(
                        product_id=pid,
                        developer_user_id=r.get("developer_id") or 0,
                        product_name=name,
                        price=Decimal("0.00"),
                        visible=False,
                        first_sold_at=purchase_date,
                        last_sold_at=purchase_date,
                    )
                else:
                    # If no purchase_date, set to a default, but since nullable=False, perhaps skip or set to now
                    # But according to requirement, purchase_date should be present for income logs
                    continue
                self.session.add(prod)
                existing_products[pid] = prod