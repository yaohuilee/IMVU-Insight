from __future__ import annotations

from decimal import Decimal
from typing import List
from datetime import datetime

from app.routes.imvu_user import OrderItem, PaginationParams
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.db import get_db_session
from app.services.buyer_service import BuyerService


router = APIRouter(prefix="/buyer", tags=["Buyer"])


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


class BuyerOption(BaseModel):
    value: int
    label: str | None = None


class BuyerOptionsRequest(BaseModel):
    keyword: str | None = None
    limit: int = Field(20, description="Maximum number of options to return when using recent buyers fallback")


@router.post(
    "/list",
    operation_id="listBuyers",
    summary="List buyer aggregated stats (paginated)",
    response_model=PaginatedBuyerResponse,
)
async def list_buyers(
    params: PaginationParams,
    session: AsyncSession = Depends(get_db_session),
):
    """Return paginated buyer aggregated stats."""

    svc = BuyerService(session)
    items, total = await svc.list_paginated(
        page=params.page, per_page=params.page_size, orders=params.orders, keyword=getattr(params, "keyword", None)
    )

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


@router.post(
    "/options",
    operation_id="listBuyerOptions",
    summary="List buyer options for select inputs",
    response_model=List[BuyerOption],
)
async def list_buyer_options(
    body: BuyerOptionsRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Return select options for buyers. If `keyword` is provided and non-empty, search users by name or id.
    Otherwise return the most-recent 20 buyers by payment time.
    """

    keyword = (body.keyword or "").strip()
    limit = max(1, int(body.limit or 20))

    # If keyword provided, search ImvuUser by name (case-insensitive) or by id when numeric.
    if keyword:
        from sqlalchemy import or_
        from app.models import ImvuUser

        stmt = None
        try:
            user_id = int(keyword)
        except Exception:
            user_id = None

        if user_id is not None:
            stmt = select(ImvuUser.user_id, ImvuUser.user_name).where(
                or_(ImvuUser.user_id == user_id, ImvuUser.user_name.ilike(f"%{keyword}%"))
            )
        else:
            stmt = select(ImvuUser.user_id, ImvuUser.user_name).where(ImvuUser.user_name.ilike(f"%{keyword}%"))

        stmt = stmt.order_by(ImvuUser.user_name).limit(50)
        res = await session.execute(stmt)
        rows = res.mappings().all()
        options = [BuyerOption(value=int(r["user_id"]), label=r.get("user_name")) for r in rows]
        return options

    # Fallback: get buyers from IncomeTransaction ordered by latest transaction_time
    from sqlalchemy import func, desc
    from app.models import IncomeTransaction, ImvuUser

    subq = (
        select(
            IncomeTransaction.buyer_user_id.label("buyer_user_id"),
            func.max(IncomeTransaction.transaction_time).label("last_paid"),
        )
        .group_by(IncomeTransaction.buyer_user_id)
        .order_by(desc(func.max(IncomeTransaction.transaction_time)))
        .limit(limit)
        .subquery()
    )

    stmt = (
        select(ImvuUser.user_id, ImvuUser.user_name)
        .join(subq, ImvuUser.user_id == subq.c.buyer_user_id)
        .order_by(desc(subq.c.last_paid))
    )

    res = await session.execute(stmt)
    rows = res.mappings().all()
    options = [BuyerOption(value=int(r["user_id"]), label=r.get("user_name")) for r in rows]
    return options
