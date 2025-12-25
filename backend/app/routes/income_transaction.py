from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.db import get_db_session
from app.services.income_transaction_service import IncomeTransactionService
from app.services.product_service import ProductService
from app.services.imvu_user_service import ImvuUserService
from app.models import Product, ImvuUser


router = APIRouter(prefix="/income_transaction", tags=["IncomeTransaction"])


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="Page number (1-based)")
    page_size: int = Field(50, ge=1, le=500, description="Items per page")


class ProductSummary(BaseModel):
    product_id: int
    product_name: str
    visible: bool
    price: float


class ImvuUserSummary(BaseModel):
    id: int
    name: str | None = None


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


@router.get(
    "/list",
    operation_id="listIncomeTransactions",
    summary="List IncomeTransaction objects (paginated)",
    response_model=PaginatedIncomeTransactionResponse,
)
async def list_income_transactions(
    params: PaginationParams = Depends(),
    session: AsyncSession = Depends(get_db_session),
):
    svc = IncomeTransactionService(session)
    prod_svc = ProductService(session)
    user_svc = ImvuUserService(session)

    rows, total = await svc.list_paginated_with_relations(page=params.page, per_page=params.page_size)

    result_items: list[IncomeTransactionItem] = []
    for t, prod, buyer, recipient in rows:
        prod_summary = (
            ProductSummary(
                product_id=prod.product_id,
                product_name=prod.product_name,
                visible=prod.visible,
                price=float(prod.price),
            )
            if prod is not None
            else None
        )

        buyer_summary = ImvuUserSummary(id=buyer.user_id, name=buyer.user_name) if buyer is not None else None
        recipient_summary = ImvuUserSummary(id=recipient.user_id, name=recipient.user_name) if recipient is not None else None

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

    return PaginatedIncomeTransactionResponse(total=total, page=params.page, page_size=params.page_size, items=result_items)
