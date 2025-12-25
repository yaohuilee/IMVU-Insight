from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import Column, BigInteger, DateTime, Numeric, TIMESTAMP

from . import Base


class IncomeTransaction(Base):
    __tablename__ = "income_transaction"

    transaction_id = Column(BigInteger, primary_key=True, nullable=False)

    transaction_time = Column(DateTime, nullable=False, index=True)

    product_id = Column(BigInteger, nullable=False, index=True)
    developer_user_id = Column(BigInteger, nullable=False, index=True)
    buyer_user_id = Column(BigInteger, nullable=False, index=True)
    recipient_user_id = Column(BigInteger, nullable=False, index=True)
    reseller_user_id = Column(BigInteger, nullable=True)

    paid_credits = Column(Numeric(18, 6), nullable=False)
    paid_promo_credits = Column(Numeric(18, 6), nullable=False)
    income_credits = Column(Numeric(18, 6), nullable=False)
    income_promo_credits = Column(Numeric(18, 6), nullable=False)

    paid_total_credits = Column(Numeric(18, 6), nullable=False)
    income_total_credits = Column(Numeric(18, 6), nullable=False)

    created_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc))

    def __repr__(self) -> str:  # pragma: no cover - trivial
        return f"<IncomeTransaction {self.transaction_id}>"
