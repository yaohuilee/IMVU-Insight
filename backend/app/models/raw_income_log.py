from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    String,
    Date,
    DateTime,
    ForeignKey,
)

from . import Base


class RawIncomeLog(Base):
    __tablename__ = "raw_income_log"

    id = Column(BigInteger, primary_key=True)

    # XML parent: developer_id attribute on the root node
    developer_id = Column(BigInteger, nullable=False, index=True)
    # file / snapshot
    sync_record_id = Column(Integer, ForeignKey("data_sync_records.id", ondelete="CASCADE"), nullable=False, index=True)
    snapshot_date = Column(Date, nullable=False, index=True)

    # XML raw fields (1:1 mapping)
    sales_log_id = Column(BigInteger, nullable=False, index=True)

    buyer_id = Column(BigInteger, nullable=False, index=True)
    buyer_name = Column(String(255), nullable=False)

    recipient_id = Column(BigInteger, nullable=False, index=True)
    recipient_name = Column(String(255), nullable=False)

    reseller_id = Column(String(64), nullable=False)
    reseller_name = Column(String(255), nullable=False)

    product_id = Column(BigInteger, nullable=False, index=True)
    product_name = Column(String(255), nullable=False)

    price_factor = Column(String(32), nullable=False)

    paid_credits = Column(String(32), nullable=False)
    paid_promo_credits = Column(String(32), nullable=False)

    income_credits = Column(String(32), nullable=False)
    income_promo_credits = Column(String(32), nullable=False)

    purchase_date = Column(DateTime, nullable=False)
    credit_delivery_date = Column(String(32), nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

