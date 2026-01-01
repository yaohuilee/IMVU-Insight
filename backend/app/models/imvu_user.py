from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Column, BigInteger, String, DateTime

from . import Base


class ImvuUser(Base):
    __tablename__ = "imvu_user"

    user_id = Column(BigInteger, primary_key=True)

    # Latest known display name
    user_name = Column(String(255), nullable=True)

    # First/last time seen in raw data
    first_seen_at = Column(DateTime, nullable=False)
    last_seen_at = Column(DateTime, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    developer_user_id = Column(BigInteger, nullable=False, index=True)

