from __future__ import annotations

from typing import Optional, List, Tuple
from decimal import Decimal
from datetime import datetime

from sqlalchemy import select, func, asc, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Product


class ProductService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        *,
        product_id: int,
        developer_user_id: int,
        product_name: str,
        price: Decimal,
        visible: bool,
    ) -> Product:
        obj = Product(
            product_id=product_id,
            developer_user_id=developer_user_id,
            product_name=product_name,
            price=price,
            visible=visible,
        )
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def delete_by_id(self, product_id: int) -> bool:
        stmt = select(Product).where(Product.product_id == product_id)
        res = await self.session.execute(stmt)
        obj = res.scalar_one_or_none()
        if obj is None:
            return False
        await self.session.delete(obj)
        await self.session.commit()
        return True

    async def update_by_id(self, product_id: int, **fields) -> Optional[Product]:
        """Update allowed fields for a Product by `product_id`. Returns updated Product or None."""
        stmt = select(Product).where(Product.product_id == product_id)
        res = await self.session.execute(stmt)
        obj = res.scalar_one_or_none()
        if obj is None:
            return None
        allowed = {"developer_user_id", "product_name", "price", "visible"}
        for k, v in fields.items():
            if k in allowed:
                setattr(obj, k, v)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def exists(self, product_id: int) -> bool:
        stmt = select(1).where(Product.product_id == product_id).limit(1)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none() is not None

    async def get_by_id(self, product_id: int) -> Optional[Product]:
        stmt = select(Product).where(Product.product_id == product_id).limit(1)
        res = await self.session.execute(stmt)
        return res.scalars().first()

    async def list_paginated(self, page: int = 1, per_page: int = 50, orders: Optional[list] = None) -> Tuple[List[Product], int]:
        """Return (items, total_count) for given `page` (1-based) and `per_page`."""
        if page < 1:
            page = 1
        offset = (page - 1) * per_page
        stmt = select(Product)

        order_cols = []
        if orders:
            special_map = {
                "id": "product_id",
                "product_id": "product_id",
                "name": "product_name",
                "product_name": "product_name",
                "price": "price",
            }

            for o in orders:
                if hasattr(o, "property"):
                    prop = getattr(o, "property")
                    direction = (getattr(o, "direction", None) or "ASC").upper()
                else:
                    prop = o.get("property")
                    direction = (o.get("direction") or "ASC").upper()

                if not prop:
                    continue

                mapped = special_map.get(prop)
                col = None
                if mapped:
                    col = getattr(Product, mapped, None)
                else:
                    col = getattr(Product, prop, None)
                    if col is None:
                        snake = "".join(["_" + c.lower() if c.isupper() else c for c in prop]).lstrip("_")
                        col = getattr(Product, snake, None)

                if col is not None:
                    order_cols.append(asc(col) if direction == "ASC" else desc(col))

        if order_cols:
            stmt = stmt.order_by(*order_cols)
        else:
            stmt = stmt.order_by(Product.product_id)

        stmt = stmt.offset(offset).limit(per_page)
        res = await self.session.execute(stmt)
        items = res.scalars().all()

        count_stmt = select(func.count()).select_from(Product)
        cnt_res = await self.session.execute(count_stmt)
        total = int(cnt_res.scalar_one())
        return items, total
