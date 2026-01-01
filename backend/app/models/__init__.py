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
from .income_transaction import IncomeTransaction  # noqa: F401
from .user import User  # noqa: F401
from .refresh_token import RefreshToken  # noqa: F401
from .user_developer import UserDeveloper  # noqa: F401

__all__ = [
    "DataSyncRecord",
    "RawProductList",
    "RawIncomeLog",
    "Developer",
    "ImvuUser",
    "Product",
    "IncomeTransaction",
    "User",
    "RefreshToken",
    "UserDeveloper",
]
