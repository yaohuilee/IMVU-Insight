from __future__ import annotations

from typing import Optional, Sequence, Tuple

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.data_sync import DataSyncRecord, DataType


class DataSyncService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_hash(self, hash_value: str) -> Optional[DataSyncRecord]:
        stmt = select(DataSyncRecord).where(DataSyncRecord.hash == hash_value).order_by(DataSyncRecord.uploaded_at.desc())
        res = await self.session.execute(stmt)
        return res.scalars().first()

    async def create(
        self,
        *,
        type: DataType,
        filename: str,
        hash: str,
        record_count: int,
        file_size: int,
        content: bytes,
    ) -> DataSyncRecord:
        record = DataSyncRecord(
            type=type,
            filename=filename,
            hash=hash,
            record_count=record_count,
            file_size=file_size,
            content=content,
        )
        self.session.add(record)
        await self.session.commit()
        await self.session.refresh(record)
        return record

    async def delete(self, record_id: int) -> bool:
        stmt = select(DataSyncRecord).where(DataSyncRecord.id == record_id)
        res = await self.session.execute(stmt)
        record = res.scalar_one_or_none()
        if record is None:
            return False
        await self.session.delete(record)
        await self.session.commit()
        return True

    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        type: Optional[DataType] = None,
    ) -> Tuple[Sequence[DataSyncRecord], int]:
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 20

        base_q = select(DataSyncRecord)
        count_q = select(func.count()).select_from(DataSyncRecord)
        if type is not None:
            base_q = base_q.where(DataSyncRecord.type == type)
            count_q = count_q.where(DataSyncRecord.type == type)

        base_q = base_q.order_by(DataSyncRecord.uploaded_at.desc())

        total_res = await self.session.execute(count_q)
        total = int(total_res.scalar_one() or 0)

        offset = (page - 1) * page_size
        page_res = await self.session.execute(base_q.offset(offset).limit(page_size))
        records = page_res.scalars().all()
        return records, total

