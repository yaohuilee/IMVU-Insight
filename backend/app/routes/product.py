from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from app.routes.imvu_user import OrderItem, PaginationParams
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db_session
from app.services.product_service import ProductService


router = APIRouter(prefix="/product", tags=["Product"])


class ProductSummary(BaseModel):
    id: int
    name: str
    visible: bool
    price: Decimal
    first_sold_at: datetime | None = None
    last_sold_at: datetime | None = None


class PaginatedProductResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[ProductSummary]


@router.post(
    "/list",
    operation_id="listProducts",
    summary="List Product objects (paginated)",
    response_model=PaginatedProductResponse,
)
async def list_products(
    params: PaginationParams,
    session: AsyncSession = Depends(get_db_session),
):
    """Return paginated products (only summary fields). Parameters are passed as an object via `Depends` for future extension."""

    svc = ProductService(session)
    items, total = await svc.list_paginated(page=params.page, per_page=params.page_size, orders=params.orders)

    result_items = [
        ProductSummary(
            id=p.product_id,
            name=p.product_name,
            visible=p.visible,
            price=p.price,
            first_sold_at=getattr(p, "first_sold_at", None),
            last_sold_at=getattr(p, "last_sold_at", None),
        )
        for p in items
    ]

    return PaginatedProductResponse(total=total, page=params.page, page_size=params.page_size, items=result_items)
