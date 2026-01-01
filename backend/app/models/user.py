from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Column, BigInteger, String, DateTime, Boolean
from sqlalchemy.orm import relationship

from . import Base


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # Login username
    username = Column(String(64), nullable=False, unique=True)

    # Password hash (bcrypt/argon2)
    password_hash = Column(String(255), nullable=False)

    is_admin = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)

    # Last successful login time
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Mapping rows linking this user to IMVU developer IDs
    developer_links = relationship(
        "UserDeveloper",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    @property
    def developer_ids(self) -> list[int]:
        return [link.developer_id for link in self.developer_links]
