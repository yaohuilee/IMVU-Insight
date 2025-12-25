from __future__ import annotations

from typing import Optional, Sequence, Dict

from datetime import date, datetime, time

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.imvu_user import ImvuUser


class DataSyncImvuUserService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def collect_income_user_map(self, records: Sequence[Dict]) -> Dict[int, Dict]:
        """Collect a mapping of numeric user_id -> latest available name from income records.

        Reseller IDs may be non-numeric; only numeric IDs are included.
        """
        # Map user_id -> {"name": str, "min_dt": datetime|None, "max_dt": datetime|None}
        user_map: Dict[int, Dict] = {}
        for r in records:
            purchase_dt = r.get("purchase_date")

            # buyer
            bid = r.get("buyer_id")
            if bid is not None:
                entry = user_map.setdefault(bid, {"name": r.get("buyer_name") or "", "min_dt": None, "max_dt": None})
                if entry["name"] == "" and (r.get("buyer_name") or ""):
                    entry["name"] = r.get("buyer_name") or ""
                if isinstance(purchase_dt, datetime):
                    if entry["min_dt"] is None or purchase_dt < entry["min_dt"]:
                        entry["min_dt"] = purchase_dt
                    if entry["max_dt"] is None or purchase_dt > entry["max_dt"]:
                        entry["max_dt"] = purchase_dt

            # recipient
            rid = r.get("recipient_id")
            if rid is not None:
                entry = user_map.setdefault(rid, {"name": r.get("recipient_name") or "", "min_dt": None, "max_dt": None})
                if entry["name"] == "" and (r.get("recipient_name") or ""):
                    entry["name"] = r.get("recipient_name") or ""
                if isinstance(purchase_dt, datetime):
                    if entry["min_dt"] is None or purchase_dt < entry["min_dt"]:
                        entry["min_dt"] = purchase_dt
                    if entry["max_dt"] is None or purchase_dt > entry["max_dt"]:
                        entry["max_dt"] = purchase_dt

            # reseller (may be non-numeric in raw data)
            res_raw = r.get("reseller_id")
            try:
                resid = int(res_raw) if res_raw is not None and str(res_raw) != "" else None
            except Exception:
                resid = None
            if resid is not None:
                entry = user_map.setdefault(resid, {"name": r.get("reseller_name") or "", "min_dt": None, "max_dt": None})
                if entry["name"] == "" and (r.get("reseller_name") or ""):
                    entry["name"] = r.get("reseller_name") or ""
                if isinstance(purchase_dt, datetime):
                    if entry["min_dt"] is None or purchase_dt < entry["min_dt"]:
                        entry["min_dt"] = purchase_dt
                    if entry["max_dt"] is None or purchase_dt > entry["max_dt"]:
                        entry["max_dt"] = purchase_dt

        return user_map

    async def ensure_imvu_users_from_map(self, *, user_id_name_map: Dict[int, Dict], snapshot_date: date) -> None:
        """Create or update ImvuUser rows for given id->info map.

        `user_id_name_map` is expected to map user_id -> {"name": str, "min_dt": datetime|None, "max_dt": datetime|None}.

        For existing users: if a record has an earlier `min_dt` than `first_seen_at`, update `first_seen_at`.
        If a record has a later `max_dt` than `last_seen_at`, update `last_seen_at` and the `user_name`.

        If no datetimes are available for a user, fall back to the import `snapshot_date` at midnight.
        """
        if not user_id_name_map:
            return

        stmt = select(ImvuUser).where(ImvuUser.user_id.in_(list(user_id_name_map.keys())))
        res = await self.session.execute(stmt)
        existing_users = {u.user_id: u for u in res.scalars().all()}

        snapshot_dt = datetime.combine(snapshot_date, time.min)
        for uid, info in user_id_name_map.items():
            name = info.get("name") or None
            min_dt = info.get("min_dt")
            max_dt = info.get("max_dt")

            # creation fallback times
            create_first = min_dt or snapshot_dt
            create_last = max_dt or snapshot_dt

            if uid in existing_users:
                u = existing_users[uid]
                try:
                    cur_first = u.first_seen_at
                except Exception:
                    cur_first = None
                try:
                    cur_last = u.last_seen_at
                except Exception:
                    cur_last = None

                # Update first_seen_at if we found an earlier time
                if min_dt is not None and (cur_first is None or min_dt < cur_first):
                    u.first_seen_at = min_dt

                # Update last_seen_at and user_name if we found a later time
                if max_dt is not None and (cur_last is None or max_dt > cur_last):
                    u.last_seen_at = max_dt
                    if name:
                        u.user_name = name or u.user_name
            else:
                new_u = ImvuUser(user_id=uid, user_name=name, first_seen_at=create_first, last_seen_at=create_last)
                self.session.add(new_u)