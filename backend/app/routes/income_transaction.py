from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.db import get_db_session
from app.services.income_transaction_service import IncomeTransactionService
from app.routes.imvu_user import ImvuUserSummary, OrderItem
from app.routes.product import ProductSummary, _get_user_developer_ids


router = APIRouter(prefix="/income_transaction", tags=["IncomeTransaction"])


class IncomeTransactionItem(BaseModel):
    transaction_id: int
    transaction_time: datetime

    product_id: int
    product: ProductSummary | None = None

    developer_user_id: int

    buyer_user_id: int
    buyer_user: ImvuUserSummary | None = None

    recipient_user_id: int
    recipient_user: ImvuUserSummary | None = None

    reseller_user_id: int | None = None

    paid_credits: float
    paid_promo_credits: float
    income_credits: float
    income_promo_credits: float

    paid_total_credits: float
    income_total_credits: float

    created_at: datetime


class PaginatedIncomeTransactionResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[IncomeTransactionItem]


class IncomeTransactionPaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="Page number (1-based)")
    page_size: int = Field(50, ge=1, le=200, description="Items per page")
    orders: list[OrderItem] = []

    product_id: list[int] | None = None
    buyer_user_id: list[int] | None = None
    recipient_user_id: list[int] | None = None


@router.post(
    "/list",
    operation_id="listIncomeTransactions",
    summary="List IncomeTransaction objects (paginated)",
    response_model=PaginatedIncomeTransactionResponse,
)
async def list_income_transactions(
    params: IncomeTransactionPaginationParams,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
):
    developer_ids = await _get_user_developer_ids(request, session)
    if not developer_ids:
        return PaginatedIncomeTransactionResponse(total=0, page=params.page, page_size=params.page_size, items=[])

    svc = IncomeTransactionService(session)

    rows, total = await svc.list_paginated_with_relations(
        page=params.page,
        per_page=params.page_size,
        orders=params.orders,
        product_ids=params.product_id,
        buyer_user_ids=params.buyer_user_id,
        recipient_user_ids=params.recipient_user_id,
        developer_ids=developer_ids,
    )

    result_items: list[IncomeTransactionItem] = []
    for t, prod, buyer, recipient in rows:
        prod_summary = (
            ProductSummary(
                id=prod.product_id,
                name=prod.product_name,
                visible=prod.visible,
                price=float(prod.price),
            )
            if prod is not None
            else None
        )

        buyer_summary = (
            ImvuUserSummary(id=buyer.user_id, name=buyer.user_name) if buyer is not None else None
        )
        recipient_summary = (
            ImvuUserSummary(id=recipient.user_id, name=recipient.user_name)
            if recipient is not None
            else None
        )

        result_items.append(
            IncomeTransactionItem(
                transaction_id=t.transaction_id,
                transaction_time=t.transaction_time,
                product_id=t.product_id,
                product=prod_summary,
                developer_user_id=t.developer_user_id,
                buyer_user_id=t.buyer_user_id,
                buyer_user=buyer_summary,
                recipient_user_id=t.recipient_user_id,
                recipient_user=recipient_summary,
                reseller_user_id=getattr(t, "reseller_user_id", None),
                paid_credits=float(t.paid_credits),
                paid_promo_credits=float(t.paid_promo_credits),
                income_credits=float(t.income_credits),
                income_promo_credits=float(t.income_promo_credits),
                paid_total_credits=float(t.paid_total_credits),
                income_total_credits=float(t.income_total_credits),
                created_at=getattr(t, "created_at", None),
            )
        )

    return PaginatedIncomeTransactionResponse(
        total=total, page=params.page, page_size=params.page_size, items=result_items
    )
