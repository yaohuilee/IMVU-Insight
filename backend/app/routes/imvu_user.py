from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db_session
from app.services.imvu_user_service import ImvuUserService


router = APIRouter(prefix="/imvu_user", tags=["IMVU User"])


class OrderItem(BaseModel):
    property: str
    direction: Optional[str] = None  # "ASC" or "DESC"


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="Page number (1-based)")
    page_size: int = Field(50, ge=1, le=200, description="Items per page")
    orders: list[OrderItem] = []
    keyword: str | None = None


class ImvuUserSummary(BaseModel):
    id: int
    name: str | None = None
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None


class PaginatedImvuUserResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[ImvuUserSummary]


@router.post(
    "/list",
    operation_id="listImvuUsers",
    summary="List ImvuUser objects (paginated)",
    response_model=PaginatedImvuUserResponse,
)
async def list_imvu_users(
    params: PaginationParams,
    session: AsyncSession = Depends(get_db_session),
):
    """Return paginated imvu users (summary fields)."""

    svc = ImvuUserService(session)
    items, total = await svc.list_paginated(
        page=params.page, per_page=params.page_size, orders=params.orders, keyword=getattr(params, "keyword", None)
    )

    result_items = [
        ImvuUserSummary(
            id=u.user_id,
            name=u.user_name,
            first_seen=u.first_seen_at,
            last_seen=u.last_seen_at,
        )
        for u in items
    ]

    return PaginatedImvuUserResponse(
        total=total, page=params.page, page_size=params.page_size, items=result_items
    )
