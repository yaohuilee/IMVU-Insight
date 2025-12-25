from __future__ import annotations

from typing import Sequence, Dict, Set
from decimal import Decimal, InvalidOperation

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.income_transaction import IncomeTransaction


class DataSyncIncomeService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_transactions_from_records(self, records: Sequence[Dict]) -> None:
        """Create `IncomeTransaction` objects from raw income log records and add them to the session.

        This method does not commit; caller should commit when appropriate.
        """
        if not records:
            return

        def _to_decimal(v) -> Decimal:
            if v is None:
                return Decimal("0")
            try:
                return Decimal(v)
            except (InvalidOperation, TypeError):
                try:
                    return Decimal(str(float(v)))
                except Exception:
                    return Decimal("0")

        objs = []
        for r in records:
            sales_log_id = r.get("sales_log_id")
            if sales_log_id is None:
                continue

            reseller_raw = r.get("reseller_id")
            reseller_user_id = None if reseller_raw in (None, "") else int(reseller_raw)

            paid = _to_decimal(r.get("paid_credits"))
            paid_promo = _to_decimal(r.get("paid_promo_credits"))
            income = _to_decimal(r.get("income_credits"))
            income_promo = _to_decimal(r.get("income_promo_credits"))

            obj = IncomeTransaction(
                transaction_id=sales_log_id,
                transaction_time=r.get("purchase_date"),
                product_id=r.get("product_id"),
                developer_user_id=r.get("developer_id"),
                buyer_user_id=r.get("buyer_id"),
                recipient_user_id=r.get("recipient_id"),
                reseller_user_id=reseller_user_id,
                paid_credits=paid,
                paid_promo_credits=paid_promo,
                income_credits=income,
                income_promo_credits=income_promo,
                paid_total_credits=(paid + paid_promo),
                income_total_credits=(income + income_promo),
            )
            objs.append(obj)

        if objs:
            self.session.add_all(objs)
