from __future__ import annotations

from typing import List, Tuple, Optional

from sqlalchemy import select, func, asc, desc, or_, cast, String
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import IncomeTransaction, ImvuUser


class RecipientService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_paginated(
        self,
        page: int = 1,
        per_page: int = 50,
        orders: Optional[list] = None,
        keyword: Optional[str] = None,
    ) -> Tuple[List[dict], int]:
        if page < 1:
            page = 1
        offset = (page - 1) * per_page
        user_id_expr = ImvuUser.user_id.label("user_id")
        user_name_expr = ImvuUser.user_name.label("user_name")
        first_seen_expr = ImvuUser.first_seen_at.label("first_seen_at")
        last_seen_expr = ImvuUser.last_seen_at.label("last_seen_at")
        receive_count_expr = func.count(IncomeTransaction.transaction_id).label("receive_count")
        total_received_expr = func.sum(IncomeTransaction.paid_total_credits).label("total_received")
        total_credits_expr = func.sum(IncomeTransaction.paid_credits).label("total_credits")
        total_promo_expr = func.sum(IncomeTransaction.paid_promo_credits).label("total_promo_credits")

        stmt = (
            select(
                user_id_expr,
                user_name_expr,
                first_seen_expr,
                last_seen_expr,
                receive_count_expr,
                total_received_expr,
                total_credits_expr,
                total_promo_expr,
            )
            .join_from(IncomeTransaction, ImvuUser, IncomeTransaction.recipient_user_id == ImvuUser.user_id)
            .group_by(
                ImvuUser.user_id,
                ImvuUser.user_name,
                ImvuUser.first_seen_at,
                ImvuUser.last_seen_at,
            )
        )

        # apply keyword filter when provided (fuzzy match on user_name OR user_id)
        if keyword:
            kw = keyword.strip()
            if kw:
                stmt = stmt.where(
                    or_(
                        ImvuUser.user_name.ilike(f"%{kw}%"),
                        cast(ImvuUser.user_id, String).ilike(f"%{kw}%"),
                    )
                )

        order_cols = []
        if orders:
            special_map = {
                "id": user_id_expr,
                "name": user_name_expr,
                "first_seen": first_seen_expr,
                "last_seen": last_seen_expr,
                "receive_count": receive_count_expr,
                "total_received": total_received_expr,
                "total_credits": total_credits_expr,
                "total_promo_credits": total_promo_expr,
            }

            for o in orders:
                if hasattr(o, "property"):
                    prop = getattr(o, "property")
                    direction = (getattr(o, "direction", None) or "ASC").upper()
                else:
                    prop = o.get("property")
                    direction = (o.get("direction") or "ASC").upper()

                if not prop:
                    continue

                col = special_map.get(prop)
                if col is None:
                    col = getattr(ImvuUser, prop, None)
                    if col is None:
                        snake = "".join(["_" + c.lower() if c.isupper() else c for c in prop]).lstrip("_")
                        col = getattr(ImvuUser, snake, None)

                if col is not None:
                    order_cols.append(asc(col) if direction == "ASC" else desc(col))

        if order_cols:
            stmt = stmt.order_by(*order_cols)
        else:
            stmt = stmt.order_by(ImvuUser.last_seen_at.desc())

        stmt = stmt.offset(offset).limit(per_page)

        res = await self.session.execute(stmt)
        items = res.mappings().all()

        count_stmt = (
            select(func.count(func.distinct(IncomeTransaction.recipient_user_id))).select_from(IncomeTransaction)
        )
        if keyword:
            kw = keyword.strip()
            if kw:
                count_stmt = (
                    count_stmt.join(ImvuUser, IncomeTransaction.recipient_user_id == ImvuUser.user_id)
                    .where(
                        or_(
                            ImvuUser.user_name.ilike(f"%{kw}%"),
                            cast(ImvuUser.user_id, String).ilike(f"%{kw}%"),
                        )
                    )
                )

        cnt_res = await self.session.execute(count_stmt)
        total = int(cnt_res.scalar_one())
        return items, total
