from __future__ import annotations

from decimal import Decimal
from typing import List
from datetime import datetime

from app.routes.imvu_user import OrderItem
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db_session
from app.services.recipient_service import RecipientService


router = APIRouter(prefix="/recipient", tags=["Recipient"])


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="Page number (1-based)")
    page_size: int = Field(50, ge=1, le=200, description="Items per page")
    orders: list[OrderItem] = []


class RecipientSummary(BaseModel):
    id: int
    name: str | None = None
    receive_count: int
    total_received: Decimal
    total_credits: Decimal
    total_promo_credits: Decimal
    first_seen: datetime
    last_seen: datetime


class PaginatedRecipientResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[RecipientSummary]


@router.get(
    "/list",
    operation_id="listRecipients",
    summary="List recipient aggregated stats (paginated)",
    response_model=PaginatedRecipientResponse,
)
async def list_recipients(
    params: PaginationParams = Depends(),
    session: AsyncSession = Depends(get_db_session),
):
    """Return paginated recipient aggregated stats."""

    svc = RecipientService(session)
    items, total = await svc.list_paginated(page=params.page, per_page=params.page_size)

    result_items = [
        RecipientSummary(
            id=int(r["user_id"]),
            name=r.get("user_name"),
            receive_count=int(r["receive_count"]),
            total_received=r.get("total_received") or Decimal(0),
            total_credits=r.get("total_credits") or Decimal(0),
            total_promo_credits=r.get("total_promo_credits") or Decimal(0),
            first_seen=r.get("first_seen_at"),
            last_seen=r.get("last_seen_at"),
        )
        for r in items
    ]

    return PaginatedRecipientResponse(total=total, page=params.page, page_size=params.page_size, items=result_items)
