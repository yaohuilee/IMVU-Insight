from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings


def create_engine() -> AsyncEngine:
    settings = get_settings()
    return create_async_engine(
        settings.sqlalchemy_database_uri,
        echo=settings.mysql.echo,
        pool_pre_ping=True,
    )


engine: AsyncEngine = create_engine()
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)


async def get_db_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session


async def check_db_connection(session: AsyncSession) -> None:
    await session.execute(text("SELECT 1"))
