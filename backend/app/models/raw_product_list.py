from __future__ import annotations

from datetime import datetime, timezone, date

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


class RawProductList(Base):
    __tablename__ = "raw_product_list"

    id = Column(BigInteger, primary_key=True)

    # XML parent: developer_id attribute on the root node
    developer_id = Column(BigInteger, nullable=False, index=True)

    # file / snapshot
    sync_record_id = Column(Integer, ForeignKey("data_sync_records.id", ondelete="CASCADE"), nullable=False, index=True)
    snapshot_date = Column(Date, nullable=False, index=True)

    # XML raw fields (1:1 mapping)
    product_id = Column(BigInteger, nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    price = Column(String(32), nullable=False)
    profit = Column(String(32), nullable=False)
    visible = Column(String(1), nullable=False)

    old_sales = Column(String(32), nullable=False)
    new_sales = Column(String(32), nullable=False)
    total_sales = Column(String(32), nullable=False)

    derived_product_sales = Column(String(32), nullable=False)
    direct_sales = Column(String(32), nullable=False)
    indirect_sales = Column(String(32), nullable=False)
    promoted_sales = Column(String(32), nullable=False)

    cart_adds = Column(String(32), nullable=False)
    wishlist_adds = Column(String(32), nullable=False)

    organic_impressions = Column(String(32), nullable=False)
    paid_impressions = Column(String(32), nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

