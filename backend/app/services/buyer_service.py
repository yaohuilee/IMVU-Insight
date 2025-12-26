from __future__ import annotations

from typing import List, Tuple

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import IncomeTransaction, ImvuUser


class BuyerService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_paginated(self, page: int = 1, per_page: int = 50) -> Tuple[List[dict], int]:
        if page < 1:
            page = 1
        offset = (page - 1) * per_page

        stmt = (
            select(
                ImvuUser.user_id.label("user_id"),
                ImvuUser.user_name.label("user_name"),
                ImvuUser.first_seen_at.label("first_seen_at"),
                ImvuUser.last_seen_at.label("last_seen_at"),
                func.count(IncomeTransaction.transaction_id).label("buy_count"),
                func.sum(IncomeTransaction.paid_total_credits).label("total_spent"),
                func.sum(IncomeTransaction.paid_credits).label("total_credits"),
                func.sum(IncomeTransaction.paid_promo_credits).label("total_promo_credits"),
            )
            .join_from(IncomeTransaction, ImvuUser, IncomeTransaction.buyer_user_id == ImvuUser.user_id)
            .group_by(
                ImvuUser.user_id,
                ImvuUser.user_name,
                ImvuUser.first_seen_at,
                ImvuUser.last_seen_at,
            )
            .order_by(ImvuUser.user_id)
            .offset(offset)
            .limit(per_page)
        )

        res = await self.session.execute(stmt)
        items = res.mappings().all()

        count_stmt = select(func.count(func.distinct(IncomeTransaction.buyer_user_id)))
        cnt_res = await self.session.execute(count_stmt)
        total = int(cnt_res.scalar_one())
        return items, total
