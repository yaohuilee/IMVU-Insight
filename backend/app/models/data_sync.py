from __future__ import annotations

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    BigInteger,
    LargeBinary,
    Enum as SQLEnum,
)

from . import Base


class DataType(str, enum.Enum):

    INCOME = "income"
    PRODUCT = "product"

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            value = value.lower()
            for member in cls:
                if member.value == value:
                    return member
        return super()._missing_(value)


class DataSyncRecord(Base):
    __tablename__ = "data_sync_records"

    id = Column(Integer, primary_key=True, index=True)
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    type = Column(SQLEnum(DataType, name="datasync_type", values_callable=lambda x: [e.value for e in x]), nullable=False)
    filename = Column(String(255), nullable=False)
    hash = Column(String(128), nullable=False)
    record_count = Column(Integer, nullable=False)
    file_size = Column(BigInteger, nullable=False)
    content = Column(LargeBinary, nullable=False)
    user_id = Column(BigInteger, nullable=False, index=True)
