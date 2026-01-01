from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import RefreshToken


class RefreshTokenService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, *, user_id: int, token_hash: str, expires_at: datetime, user_agent: Optional[str] = None, ip_address: Optional[str] = None) -> RefreshToken:
        obj = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def get_by_hash(self, token_hash: str) -> Optional[RefreshToken]:
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash).limit(1)
        res = await self.session.execute(stmt)
        return res.scalars().first()

    async def revoke_by_hash(self, token_hash: str, revoked_at: datetime | None = None) -> bool:
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        res = await self.session.execute(stmt)
        obj = res.scalar_one_or_none()
        if obj is None:
            return False
        obj.revoked_at = revoked_at or datetime.now(timezone.utc)
        await self.session.commit()
        return True

    async def revoke_by_user(self, user_id: int) -> int:
        stmt = select(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.revoked_at == None)
        res = await self.session.execute(stmt)
        items = res.scalars().all()
        for it in items:
            it.revoked_at = datetime.now(timezone.utc)
        await self.session.commit()
        return len(items)
