from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db_session
from app.services.product_service import ProductService


router = APIRouter(prefix="/product", tags=["Product"])


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="Page number (1-based)")
    page_size: int = Field(20, ge=1, le=200, description="Items per page")


class ProductSummary(BaseModel):
    product_id: int
    product_name: str
    visible: bool
    price: Decimal
    first_sold_at: datetime | None = None
    last_sold_at: datetime | None = None


class PaginatedProductResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[ProductSummary]


@router.get(
    "/list",
    operation_id="listProducts",
    summary="List Product objects (paginated)",
    response_model=PaginatedProductResponse,
)
async def list_products(
    params: PaginationParams = Depends(),
    session: AsyncSession = Depends(get_db_session),
):
    """Return paginated products (only summary fields). Parameters are passed as an object via `Depends` for future extension."""

    svc = ProductService(session)
    items, total = await svc.list_paginated(page=params.page, per_page=params.page_size)

    result_items = [
        ProductSummary(
            product_id=p.product_id,
            product_name=p.product_name,
            visible=p.visible,
            price=p.price,
            first_sold_at=getattr(p, "first_sold_at", None),
            last_sold_at=getattr(p, "last_sold_at", None),
        )
        for p in items
    ]

    return PaginatedProductResponse(total=total, page=params.page, page_size=params.page_size, items=result_items)
