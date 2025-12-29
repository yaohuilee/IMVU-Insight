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
from app.services.recipient_service import RecipientService


router = APIRouter(prefix="/recipient", tags=["Recipient"])


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


class RecipientOption(BaseModel):
    value: int
    label: str | None = None


class RecipientOptionsRequest(BaseModel):
    keyword: str | None = None
    limit: int = Field(20, description="Maximum number of options to return when using recent recipients fallback")


@router.post(
    "/list",
    operation_id="listRecipients",
    summary="List recipient aggregated stats (paginated)",
    response_model=PaginatedRecipientResponse,
)
async def list_recipients(
    params: PaginationParams,
    session: AsyncSession = Depends(get_db_session),
):
    """Return paginated recipient aggregated stats."""

    svc = RecipientService(session)
    items, total = await svc.list_paginated(page=params.page, per_page=params.page_size, orders=params.orders)

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


@router.post(
    "/options",
    operation_id="listRecipientOptions",
    summary="List recipient options for select inputs",
    response_model=List[RecipientOption],
)
async def list_recipient_options(
    body: RecipientOptionsRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Return select options for recipients. If `keyword` provided, search users by name or id.
    Otherwise return the most-recent recipients by payment time.
    """

    keyword = (body.keyword or "").strip()
    limit = max(1, int(body.limit or 20))

    if keyword:
        from sqlalchemy import or_
        from app.models import ImvuUser

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
        options = [RecipientOption(value=int(r["user_id"]), label=r.get("user_name")) for r in rows]
        return options

    # Fallback: get recipients from IncomeTransaction ordered by latest transaction_time
    from sqlalchemy import func, desc
    from app.models import IncomeTransaction, ImvuUser

    subq = (
        select(
            IncomeTransaction.recipient_user_id.label("recipient_user_id"),
            func.max(IncomeTransaction.transaction_time).label("last_paid"),
        )
        .group_by(IncomeTransaction.recipient_user_id)
        .order_by(desc(func.max(IncomeTransaction.transaction_time)))
        .limit(limit)
        .subquery()
    )

    stmt = (
        select(ImvuUser.user_id, ImvuUser.user_name)
        .join(subq, ImvuUser.user_id == subq.c.recipient_user_id)
        .order_by(desc(subq.c.last_paid))
    )

    res = await session.execute(stmt)
    rows = res.mappings().all()
    options = [RecipientOption(value=int(r["user_id"]), label=r.get("user_name")) for r in rows]
    return options
