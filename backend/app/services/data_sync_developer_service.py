from __future__ import annotations

from typing import Optional, Sequence, Set

from datetime import date, datetime, time

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.developer import Developer
from app.models.imvu_user import ImvuUser


class DataSyncDeveloperService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def ensure_developers_and_users(self, *, developer_ids: Set[int], snapshot_date: date) -> None:
        """Ensure Developer and ImvuUser rows exist for given developer IDs.

        Adds missing objects to the current session but does not commit.
        """
        if not developer_ids:
            return

        stmt = select(Developer).where(Developer.developer_user_id.in_(developer_ids))
        res = await self.session.execute(stmt)
        existing_devs = {d.developer_user_id for d in res.scalars().all()}
        # use a datetime at midnight for first/last seen timestamps
        snapshot_dt = datetime.combine(snapshot_date, time.min)
        to_create_devs = [
            Developer(developer_user_id=did, first_seen_at=snapshot_dt, last_seen_at=snapshot_dt)
            for did in developer_ids
            if did not in existing_devs
        ]
        if to_create_devs:
            self.session.add_all(to_create_devs)

        # Create missing ImvuUser rows for the same IDs
        stmt2 = select(ImvuUser).where(ImvuUser.user_id.in_(developer_ids))
        res2 = await self.session.execute(stmt2)
        existing_user_rows = res2.scalars().all()
        existing_users = {u.user_id for u in existing_user_rows}
        for u in existing_user_rows:
            if getattr(u, "developer_user_id", None) in (None, 0):
                u.developer_user_id = u.user_id
        to_create_users = [
            ImvuUser(
                user_id=did,
                user_name=None,
                first_seen_at=snapshot_dt,
                last_seen_at=snapshot_dt,
                developer_user_id=did,
            )
            for did in developer_ids
            if did not in existing_users
        ]
        if to_create_users:
            self.session.add_all(to_create_users)