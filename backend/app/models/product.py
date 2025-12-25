from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Column, BigInteger, String, Numeric, Boolean, DateTime

from . import Base


class Product(Base):
    __tablename__ = "product"

    product_id = Column(BigInteger, primary_key=True)

    developer_user_id = Column(BigInteger, nullable=False, index=True)

    product_name = Column(String(255), nullable=False)

    price = Column(Numeric(10, 2), nullable=False)

    visible = Column(Boolean, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
