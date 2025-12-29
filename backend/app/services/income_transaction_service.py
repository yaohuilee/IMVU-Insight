from __future__ import annotations

from typing import Optional, List, Tuple
from decimal import Decimal
from datetime import datetime

from sqlalchemy import select, func, asc, desc
from sqlalchemy.orm import aliased

from app.models import Product, ImvuUser
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import IncomeTransaction


class IncomeTransactionService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        *,
        transaction_id: int,
        transaction_time: datetime,
        product_id: int,
        developer_user_id: int,
        buyer_user_id: int,
        recipient_user_id: int,
        reseller_user_id: Optional[int],
        paid_credits: Decimal,
        paid_promo_credits: Decimal,
        income_credits: Decimal,
        income_promo_credits: Decimal,
        paid_total_credits: Decimal,
        income_total_credits: Decimal,
    ) -> IncomeTransaction:
        obj = IncomeTransaction(
            transaction_id=transaction_id,
            transaction_time=transaction_time,
            product_id=product_id,
            developer_user_id=developer_user_id,
            buyer_user_id=buyer_user_id,
            recipient_user_id=recipient_user_id,
            reseller_user_id=reseller_user_id,
            paid_credits=paid_credits,
            paid_promo_credits=paid_promo_credits,
            income_credits=income_credits,
            income_promo_credits=income_promo_credits,
            paid_total_credits=paid_total_credits,
            income_total_credits=income_total_credits,
        )
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def delete_by_id(self, transaction_id: int) -> bool:
        stmt = select(IncomeTransaction).where(IncomeTransaction.transaction_id == transaction_id)
        res = await self.session.execute(stmt)
        obj = res.scalar_one_or_none()
        if obj is None:
            return False
        await self.session.delete(obj)
        await self.session.commit()
        return True

    async def update_by_id(self, transaction_id: int, **fields) -> Optional[IncomeTransaction]:
        stmt = select(IncomeTransaction).where(IncomeTransaction.transaction_id == transaction_id)
        res = await self.session.execute(stmt)
        obj = res.scalar_one_or_none()
        if obj is None:
            return None
        allowed = {
            "transaction_time",
            "product_id",
            "developer_user_id",
            "buyer_user_id",
            "recipient_user_id",
            "reseller_user_id",
            "paid_credits",
            "paid_promo_credits",
            "income_credits",
            "income_promo_credits",
            "paid_total_credits",
            "income_total_credits",
        }
        for k, v in fields.items():
            if k in allowed:
                setattr(obj, k, v)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def exists(self, transaction_id: int) -> bool:
        stmt = select(1).where(IncomeTransaction.transaction_id == transaction_id).limit(1)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none() is not None

    async def get_by_id(self, transaction_id: int) -> Optional[IncomeTransaction]:
        stmt = (
            select(IncomeTransaction)
            .where(IncomeTransaction.transaction_id == transaction_id)
            .limit(1)
        )
        res = await self.session.execute(stmt)
        return res.scalars().first()

    async def list_paginated(
        self, page: int = 1, per_page: int = 50
    ) -> Tuple[List[IncomeTransaction], int]:
        if page < 1:
            page = 1
        offset = (page - 1) * per_page
        stmt = (
            select(IncomeTransaction)
            .order_by(desc(IncomeTransaction.transaction_id))
            .offset(offset)
            .limit(per_page)
        )
        res = await self.session.execute(stmt)
        items = res.scalars().all()

        count_stmt = select(func.count()).select_from(IncomeTransaction)
        cnt_res = await self.session.execute(count_stmt)
        total = int(cnt_res.scalar_one())
        return items, total

    async def list_paginated_with_relations(
        self,
        page: int = 1,
        per_page: int = 50,
        orders: Optional[list] = None,
        product_ids: Optional[list[int]] = None,
        buyer_user_ids: Optional[list[int]] = None,
        recipient_user_ids: Optional[list[int]] = None,
    ) -> Tuple[List[tuple], int]:
        """Return list of tuples (IncomeTransaction, Product|None, buyer ImvuUser|None, recipient ImvuUser|None) and total count.

        This performs a single SQL query with LEFT OUTER JOINs to fetch related product and user rows.
        """
        if page < 1:
            page = 1
        offset = (page - 1) * per_page

        Buyer = aliased(ImvuUser)
        Recipient = aliased(ImvuUser)

        stmt = (
            select(IncomeTransaction, Product, Buyer, Recipient)
            .join(Product, IncomeTransaction.product_id == Product.product_id, isouter=True)
            .join(Buyer, IncomeTransaction.buyer_user_id == Buyer.user_id, isouter=True)
            .join(Recipient, IncomeTransaction.recipient_user_id == Recipient.user_id, isouter=True)
        )

        # build optional WHERE clauses for IN-filters (non-empty lists only)
        where_clauses = []
        if product_ids:
            where_clauses.append(IncomeTransaction.product_id.in_(product_ids))
        if buyer_user_ids:
            where_clauses.append(IncomeTransaction.buyer_user_id.in_(buyer_user_ids))
        if recipient_user_ids:
            where_clauses.append(IncomeTransaction.recipient_user_id.in_(recipient_user_ids))

        if where_clauses:
            stmt = stmt.where(*where_clauses)

        # build ordering from `orders` similar to ImvuUserService
        order_cols = []
        if orders:
            for o in orders:
                if hasattr(o, "property"):
                    prop = getattr(o, "property")
                    direction = (getattr(o, "direction", None) or "DESC").upper()
                else:
                    prop = o.get("property")
                    direction = (o.get("direction") or "DESC").upper()

                # normalize comma-separated indices (e.g. 'buyer_user,name') to dot notation
                if isinstance(prop, str):
                    prop = prop.replace(",", ".").strip()

                if not prop:
                    continue

                col = None

                # allow ordering by joined table columns using dot notation
                # e.g., 'product.product_name', 'buyer.user_name', 'recipient.user_name'
                if isinstance(prop, str) and "." in prop:
                    left, right = prop.split(".", 1)
                    if left == "product":
                        col = getattr(Product, right, None)
                    elif left == "buyer" or left == "buyer_user":
                        col = getattr(Buyer, right, None)
                    elif left == "recipient" or left == "recipient_user":
                        col = getattr(Recipient, right, None)

                # fallback: attribute on IncomeTransaction (supports product_id, buyer_user_id, ...)
                if col is None:
                    col = getattr(IncomeTransaction, prop, None)
                    if col is None and isinstance(prop, str):
                        snake = "".join([
                            "_" + c.lower() if c.isupper() else c for c in prop
                        ]).lstrip("_")
                        col = getattr(IncomeTransaction, snake, None)

                if col is not None:
                    order_cols.append(asc(col) if direction == "ASC" else desc(col))

        if order_cols:
            stmt = stmt.order_by(*order_cols)
        else:
            stmt = stmt.order_by(desc(IncomeTransaction.transaction_id))

        stmt = stmt.offset(offset).limit(per_page)

        res = await self.session.execute(stmt)
        rows = res.all()

        count_stmt = select(func.count()).select_from(IncomeTransaction)
        if where_clauses:
            count_stmt = count_stmt.where(*where_clauses)
        cnt_res = await self.session.execute(count_stmt)
        total = int(cnt_res.scalar_one())
        return rows, total
