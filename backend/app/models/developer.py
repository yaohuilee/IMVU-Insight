from __future__ import annotations

from datetime import datetime, timezone, date

from sqlalchemy import Column, BigInteger, Date, DateTime

from . import Base


class Developer(Base):
    __tablename__ = "developer"

    developer_user_id = Column(BigInteger, primary_key=True)

    # First and last snapshot dates seen in raw_product_list
    first_seen_at = Column(Date, nullable=False)
    last_seen_at = Column(Date, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

