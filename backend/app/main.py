from __future__ import annotations

import logging

from app.security.middleware import AuthMiddleware
from fastapi import APIRouter, Depends, FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.db import check_db_connection, get_db_session
from app.core.logging import configure_logging
from app.routes.data_sync import router as data_sync_router
from app.routes.product import router as product_router
from app.routes.imvu_user import router as imvu_user_router
from app.routes.income_transaction import router as income_transaction_router
from app.routes.buyer import router as buyer_router
from app.routes.recipient import router as recipient_router
from app.routes.auth import router as auth_router


settings = get_settings()
env_mode = (settings.app.env or "dev").lower()

app = FastAPI(
    title=settings.app.name,
    version="0.1.0",
    root_path=settings.app.root_path or None,
)

app.add_middleware(AuthMiddleware)

router = APIRouter()


configure_logging()
logger = logging.getLogger(__name__)
logger.info("Starting IMVU Insight Backend (%s mode)", env_mode)


@router.get("/", operation_id="root")
async def root() -> dict:
    return {"message": "Welcome to the IMVU Insight Backend API"}


@router.get("/health", operation_id="health")
async def health() -> dict:
    return {"status": "ok"}


@router.get("/health/db", operation_id="health_db")
async def health_db(session: AsyncSession = Depends(get_db_session)) -> dict:
    try:
        await check_db_connection(session)
        return {"status": "ok", "db": "ok"}
    except SQLAlchemyError as exc:
        # Health-check endpoint: don't leak internal exception details or spam traceback.
        logger.warning("DB health check failed (%s): %s", type(exc).__name__, str(exc))
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "db": "error",
                "message": "Database is unhealthy: unable to connect.",
            },
        )
    except Exception as exc:
        logger.warning("DB health check failed (unexpected %s): %s", type(exc).__name__, str(exc))
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "db": "error",
                "message": "Database is unhealthy: unable to connect.",
            },
        )


app.include_router(router)
app.include_router(data_sync_router)
app.include_router(product_router)
app.include_router(imvu_user_router)
app.include_router(income_transaction_router)
app.include_router(buyer_router)
app.include_router(recipient_router)
app.include_router(auth_router)
