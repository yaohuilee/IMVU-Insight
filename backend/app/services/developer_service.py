from __future__ import annotations

from typing import Optional
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Developer


class DeveloperService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, *, developer_user_id: int, first_seen_at: date, last_seen_at: date) -> Developer:
        obj = Developer(
            developer_user_id=developer_user_id,
            first_seen_at=first_seen_at,
            last_seen_at=last_seen_at,
        )
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def delete(self, developer_user_id: int) -> bool:
        stmt = select(Developer).where(Developer.developer_user_id == developer_user_id)
        res = await self.session.execute(stmt)
        obj = res.scalar_one_or_none()
        if obj is None:
            return False
        await self.session.delete(obj)
        await self.session.commit()
        return True

    async def update_last_seen(self, developer_user_id: int, last_seen_at: date) -> Optional[Developer]:
        stmt = select(Developer).where(Developer.developer_user_id == developer_user_id)
        res = await self.session.execute(stmt)
        obj = res.scalar_one_or_none()
        if obj is None:
            return None
        obj.last_seen_at = last_seen_at
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def exists(self, developer_user_id: int) -> bool:
        """Return True if a Developer with given id exists."""
        stmt = select(1).where(Developer.developer_user_id == developer_user_id).limit(1)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none() is not None

    async def get_by_id(self, developer_user_id: int) -> Optional[Developer]:
        """Fetch and return a Developer by `developer_user_id`, or None if not found."""
        stmt = select(Developer).where(Developer.developer_user_id == developer_user_id).limit(1)
        res = await self.session.execute(stmt)
        return res.scalars().first()
