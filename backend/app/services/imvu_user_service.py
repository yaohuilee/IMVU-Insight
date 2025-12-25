from __future__ import annotations

from typing import Optional, List, Tuple
from datetime import datetime

from sqlalchemy import select
from sqlalchemy import select, func
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

    async def list_paginated(self, page: int = 1, per_page: int = 50) -> Tuple[List[ImvuUser], int]:
        """Return (items, total_count) for given `page` (1-based) and `per_page`."""
        if page < 1:
            page = 1
        offset = (page - 1) * per_page
        stmt = select(ImvuUser).order_by(ImvuUser.user_id).offset(offset).limit(per_page)
        res = await self.session.execute(stmt)
        items = res.scalars().all()

        count_stmt = select(func.count()).select_from(ImvuUser)
        cnt_res = await self.session.execute(count_stmt)
        total = int(cnt_res.scalar_one())
        return items, total
