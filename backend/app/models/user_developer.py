from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from . import Base


class UserDeveloper(Base):
    __tablename__ = "user_developer"
    __table_args__ = (
        UniqueConstraint("user_id", "developer_id", name="uk_user_developer"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    developer_id = Column(BigInteger, ForeignKey("developer.developer_user_id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User", back_populates="developer_links")
    developer = relationship("Developer", primaryjoin="UserDeveloper.developer_id==Developer.developer_user_id", viewonly=True)
