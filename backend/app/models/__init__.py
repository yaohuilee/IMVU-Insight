from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import model classes here so other modules can import from `app.models`
from .data_sync import DataSyncRecord  # noqa: F401
from .raw_product_list import RawProductList  # noqa: F401
from .raw_income_log import RawIncomeLog  # noqa: F401
from .developer import Developer  # noqa: F401
from .imvu_user import ImvuUser  # noqa: F401
from .product import Product  # noqa: F401

__all__ = [
    "DataSyncRecord",
    "RawProductList",
    "RawIncomeLog",
    "Developer",
    "ImvuUser",
    "Product",
]
