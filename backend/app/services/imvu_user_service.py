from __future__ import annotations

from typing import Optional, List, Tuple
from datetime import datetime

from sqlalchemy import select, func, asc, desc, or_, cast, String
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ImvuUser


class ImvuUserService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, *, user_id: int, user_name: Optional[str], first_seen_at: datetime, last_seen_at: datetime) -> ImvuUser:
        obj = ImvuUser(
            user_id=user_id,
            user_name=user_name,
            first_seen_at=first_seen_at,
            last_seen_at=last_seen_at,
        )
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def delete(self, user_id: int) -> bool:
        stmt = select(ImvuUser).where(ImvuUser.user_id == user_id)
        res = await self.session.execute(stmt)
        obj = res.scalar_one_or_none()
        if obj is None:
            return False
        await self.session.delete(obj)
        await self.session.commit()
        return True

    async def update_last_seen(self, user_id: int, last_seen_at: datetime) -> Optional[ImvuUser]:
        stmt = select(ImvuUser).where(ImvuUser.user_id == user_id)
        res = await self.session.execute(stmt)
        obj = res.scalar_one_or_none()
        if obj is None:
            return None
        obj.last_seen_at = last_seen_at
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def exists(self, user_id: int) -> bool:
        stmt = select(1).where(ImvuUser.user_id == user_id).limit(1)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none() is not None

    async def get_by_id(self, user_id: int) -> Optional[ImvuUser]:
        stmt = select(ImvuUser).where(ImvuUser.user_id == user_id).limit(1)
        res = await self.session.execute(stmt)
        return res.scalars().first()

    async def list_paginated(
        self,
        page: int = 1,
        per_page: int = 50,
        orders: Optional[list] = None,
        keyword: Optional[str] = None,
        developer_ids: Optional[list[int]] = None,
    ) -> Tuple[List[ImvuUser], int]:
        """Return (items, total_count) for given `page` (1-based) and `per_page`.

        `orders` is an optional list of objects or dicts with `property` and
        optional `direction` ("ASC"/"DESC"). We map common Java/camelCase
        names to model attributes and fall back to snake_case conversion.
        """
        if page < 1:
            page = 1
        offset = (page - 1) * per_page

        if developer_ids is not None and len(developer_ids) == 0:
            return [], 0

        stmt = select(ImvuUser)

        if developer_ids is not None:
            stmt = stmt.where(ImvuUser.developer_user_id.in_(developer_ids))

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

        # build ordering
        order_cols = []
        if orders:
            # map some common property names to model attributes
            special_map = {
                "name": "user_name",
                "id": "user_id",
                "first_seen": "first_seen_at",
                "last_seen": "last_seen_at"
            }

            for o in orders:
                # support either Pydantic object or plain dict
                if hasattr(o, "property"):
                    prop = getattr(o, "property")
                    direction = (getattr(o, "direction", None) or "ASC").upper()
                else:
                    prop = o.get("property")
                    direction = (o.get("direction") or "ASC").upper()

                if not prop:
                    continue

                mapped = special_map.get(prop)
                col = None
                if mapped:
                    col = getattr(ImvuUser, mapped, None)
                else:
                    col = getattr(ImvuUser, prop, None)
                    if col is None:
                        # camelCase -> snake_case
                        snake = "".join(
                            ["_" + c.lower() if c.isupper() else c for c in prop]
                        ).lstrip("_")
                        col = getattr(ImvuUser, snake, None)

                if col is not None:
                    order_cols.append(asc(col) if direction == "ASC" else desc(col))

        if order_cols:
            stmt = stmt.order_by(*order_cols)
        else:
            stmt = stmt.order_by(desc(ImvuUser.last_seen_at))

        stmt = stmt.offset(offset).limit(per_page)
        res = await self.session.execute(stmt)
        items = res.scalars().all()

        count_stmt = select(func.count()).select_from(ImvuUser)
        if developer_ids is not None:
            count_stmt = count_stmt.where(ImvuUser.developer_user_id.in_(developer_ids))
        if keyword:
            kw = keyword.strip()
            if kw:
                count_stmt = count_stmt.where(
                    or_(
                        ImvuUser.user_name.ilike(f"%{kw}%"),
                        cast(ImvuUser.user_id, String).ilike(f"%{kw}%"),
                    )
                )

        cnt_res = await self.session.execute(count_stmt)
        total = int(cnt_res.scalar_one())
        return items, total
