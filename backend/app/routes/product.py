from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List

from app.routes.imvu_user import OrderItem, PaginationParams
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

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


class ProductOption(BaseModel):
    value: int
    label: str | None = None


class ProductOptionsRequest(BaseModel):
    keyword: str | None = None
    limit: int = Field(20, description="Maximum number of options to return when using recent products fallback")


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
    items, total = await svc.list_paginated(
        page=params.page, per_page=params.page_size, orders=params.orders, keyword=getattr(params, "keyword", None)
    )

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


@router.post(
    "/options",
    operation_id="listProductOptions",
    summary="List product options for select inputs",
    response_model=List[ProductOption],
)
async def list_product_options(
    body: ProductOptionsRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Return select options for products. If `keyword` is provided and non-empty, search products by name or id.
    Otherwise return the most-recent products by sale time.
    """

    keyword = (body.keyword or "").strip()
    limit = max(1, int(body.limit or 20))

    if keyword:
        from sqlalchemy import or_
        from app.models import Product

        try:
            pid = int(keyword)
        except Exception:
            pid = None

        if pid is not None:
            stmt = select(Product.product_id, Product.product_name).where(
                or_(Product.product_id == pid, Product.product_name.ilike(f"%{keyword}%"))
            )
        else:
            stmt = select(Product.product_id, Product.product_name).where(Product.product_name.ilike(f"%{keyword}%"))

        stmt = stmt.order_by(Product.product_name).limit(50)
        res = await session.execute(stmt)
        rows = res.mappings().all()
        options = [ProductOption(value=int(r["product_id"]), label=r.get("product_name")) for r in rows]
        return options

    # Fallback: get products from IncomeTransaction ordered by latest transaction_time
    from sqlalchemy import func, desc
    from app.models import IncomeTransaction, Product

    subq = (
        select(
            IncomeTransaction.product_id.label("product_id"),
            func.max(IncomeTransaction.transaction_time).label("last_sold"),
        )
        .group_by(IncomeTransaction.product_id)
        .order_by(desc(func.max(IncomeTransaction.transaction_time)))
        .limit(limit)
        .subquery()
    )

    stmt = (
        select(Product.product_id, Product.product_name)
        .join(subq, Product.product_id == subq.c.product_id)
        .order_by(desc(subq.c.last_sold))
    )

    res = await session.execute(stmt)
    rows = res.mappings().all()
    options = [ProductOption(value=int(r["product_id"]), label=r.get("product_name")) for r in rows]
    return options
