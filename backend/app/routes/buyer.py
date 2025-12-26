from __future__ import annotations

from decimal import Decimal
from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db_session
from app.services.buyer_service import BuyerService


router = APIRouter(prefix="/buyer", tags=["Buyer"])


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="Page number (1-based)")
    page_size: int = Field(50, ge=1, le=200, description="Items per page")


class BuyerSummary(BaseModel):
    id: int
    name: str | None = None
    buy_count: int
    total_spent: Decimal
    total_credits: Decimal
    total_promo_credits: Decimal
    first_seen: datetime
    last_seen: datetime


class PaginatedBuyerResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[BuyerSummary]


@router.get(
    "/list",
    operation_id="listBuyers",
    summary="List buyer aggregated stats (paginated)",
    response_model=PaginatedBuyerResponse,
)
async def list_buyers(
    params: PaginationParams = Depends(),
    session: AsyncSession = Depends(get_db_session),
):
    """Return paginated buyer aggregated stats."""

    svc = BuyerService(session)
    items, total = await svc.list_paginated(page=params.page, per_page=params.page_size)

    result_items = [
        BuyerSummary(
            id=int(r["user_id"]),
            name=r.get("user_name"),
            buy_count=int(r["buy_count"]),
            total_spent=r.get("total_spent") or Decimal(0),
            total_credits=r.get("total_credits") or Decimal(0),
            total_promo_credits=r.get("total_promo_credits") or Decimal(0),
            first_seen=r.get("first_seen_at"),
            last_seen=r.get("last_seen_at"),
        )
        for r in items
    ]

    return PaginatedBuyerResponse(total=total, page=params.page, page_size=params.page_size, items=result_items)
