from __future__ import annotations

from typing import Optional, List, Tuple
from datetime import datetime

from sqlalchemy import select, func, asc, desc, or_, cast, String
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, *, username: str, password_hash: str, is_admin: bool = False, is_active: bool = True) -> User:
        obj = User(
            username=username,
            password_hash=password_hash,
            is_admin=is_admin,
            is_active=is_active,
        )
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def get_by_id(self, user_id: int) -> Optional[User]:
        stmt = (
            select(User)
            .options(selectinload(User.developer_links))
            .where(User.id == user_id)
            .limit(1)
        )
        res = await self.session.execute(stmt)
        return res.scalars().first()

    async def get_by_username(self, username: str) -> Optional[User]:
        stmt = (
            select(User)
            .options(selectinload(User.developer_links))
            .where(User.username == username)
            .limit(1)
        )
        res = await self.session.execute(stmt)
        return res.scalars().first()

    async def get_by_username_and_password_hash(self, username: str, password_hash: str) -> Optional[User]:
        stmt = (
            select(User)
            .options(selectinload(User.developer_links))
            .where(User.username == username, User.password_hash == password_hash)
            .limit(1)
        )
        res = await self.session.execute(stmt)
        return res.scalars().first()

    async def update_password_by_id(self, user_id: int, password_hash: str) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)
        res = await self.session.execute(stmt)
        obj = res.scalar_one_or_none()
        if obj is None:
            return None
        obj.password_hash = password_hash
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def update_last_login_by_id(self, user_id: int, last_login_at: datetime) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)
        res = await self.session.execute(stmt)
        obj = res.scalar_one_or_none()
        if obj is None:
            return None
        obj.last_login_at = last_login_at
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def set_is_active_by_id(self, user_id: int, is_active: bool) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)
        res = await self.session.execute(stmt)
        obj = res.scalar_one_or_none()
        if obj is None:
            return None
        obj.is_active = bool(is_active)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def set_is_admin_by_id(self, user_id: int, is_admin: bool) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)
        res = await self.session.execute(stmt)
        obj = res.scalar_one_or_none()
        if obj is None:
            return None
        obj.is_admin = bool(is_admin)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def delete(self, user_id: int) -> bool:
        stmt = select(User).where(User.id == user_id)
        res = await self.session.execute(stmt)
        obj = res.scalar_one_or_none()
        if obj is None:
            return False
        await self.session.delete(obj)
        await self.session.commit()
        return True

    async def list_paginated(self, page: int = 1, per_page: int = 50, orders: Optional[list] = None, keyword: Optional[str] = None) -> Tuple[List[User], int]:
        if page < 1:
            page = 1
        offset = (page - 1) * per_page

        stmt = select(User).options(selectinload(User.developer_links))

        if keyword:
            kw = keyword.strip()
            if kw:
                stmt = stmt.where(
                    or_(
                        User.username.ilike(f"%{kw}%"),
                        cast(User.id, String).ilike(f"%{kw}%"),
                    )
                )

        order_cols = []
        if orders:
            special_map = {"username": "username", "id": "id", "last_login": "last_login_at"}
            for o in orders:
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
                    col = getattr(User, mapped, None)
                else:
                    col = getattr(User, prop, None)
                if col is not None:
                    order_cols.append(asc(col) if direction == "ASC" else desc(col))

        if order_cols:
            stmt = stmt.order_by(*order_cols)
        else:
            stmt = stmt.order_by(desc(User.created_at))

        stmt = stmt.offset(offset).limit(per_page)
        res = await self.session.execute(stmt)
        items = res.scalars().all()

        count_stmt = select(func.count()).select_from(User)
        if keyword:
            kw = keyword.strip()
            if kw:
                count_stmt = count_stmt.where(
                    or_(
                        User.username.ilike(f"%{kw}%"),
                        cast(User.id, String).ilike(f"%{kw}%"),
                    )
                )

        cnt_res = await self.session.execute(count_stmt)
        total = int(cnt_res.scalar_one())
        return items, total
