
from __future__ import annotations
"""Routes for data sync uploads and queries.

This module provides endpoints to upload product/income files,
list uploaded records (without content), and query by file hash.
"""

import hashlib
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File, Query, HTTPException
from pydantic import BaseModel
import logging
from sqlalchemy.ext.asyncio import AsyncSession
import xml.etree.ElementTree as ET
from datetime import date

from app.core.db import get_db_session
from app.models.data_sync import DataType
from app.services import DataSyncService

router = APIRouter(prefix="/data-sync", tags=["DataSync"])

logger = logging.getLogger(__name__)


class DataSyncCreateResponse(BaseModel):
    """Response returned after successfully creating a DataSyncRecord."""

    id: int
    filename: str
    imported_count: int | None = None


class DataSyncRecordListItem(BaseModel):
    """List-friendly representation of a DataSyncRecord (excludes content)."""

    id: int
    uploaded_at: datetime
    type: DataType
    filename: str
    hash: str
    record_count: int
    file_size: int


class DataSyncRecordListResponse(BaseModel):
    """Paginated response for data sync records listing."""

    total: int
    page: int
    page_size: int
    items: list[DataSyncRecordListItem]


class DataSyncRecordByHashResponse(BaseModel):
    """Response for hash lookup: indicates existence and optional record."""

    exists: bool
    record: DataSyncRecordListItem | None = None


@router.get(
    "/list",
    operation_id="listDataSyncRecords",
    summary="List DataSyncRecord objects (paginated, no content)",
    response_model=DataSyncRecordListResponse,
)
async def list_data_sync_records(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    type: DataType | None = Query(None, description="Filter by data type"),
    session: AsyncSession = Depends(get_db_session),
):
    """Get paginated DataSyncRecord objects, excluding content."""

    svc = DataSyncService(session)
    records, total = await svc.list(page=page, page_size=page_size, type=type)

    items = [
        DataSyncRecordListItem(
            id=r.id,
            uploaded_at=r.uploaded_at,
            type=r.type,
            filename=r.filename,
            hash=r.hash,
            record_count=r.record_count,
            file_size=r.file_size,
        )
        for r in records
    ]

    return DataSyncRecordListResponse(total=total, page=page, page_size=page_size, items=items)


def _ensure_upload_dir() -> Path:
    """Ensure upload directory exists and return its Path."""

    root = Path(__file__).resolve().parents[2]
    path = root / "data" / "uploads"
    path.mkdir(parents=True, exist_ok=True)
    return path


async def _handle_upload(session: AsyncSession, file: UploadFile, dtype: DataType):
    """Read uploaded file, persist original to disk, and create a record."""

    content = await file.read()
    file_size = len(content)
    h = hashlib.sha256(content).hexdigest()

    # simple record count heuristic: count lines for text-like files
    try:
        record_count = content.count(b"\n")
        if record_count == 0 and content:
            record_count = 1
    except Exception:
        record_count = 1

    # persist original upload to disk for debugging/inspection
    upload_dir = _ensure_upload_dir()
    suffix = Path(file.filename or "").suffix or ""
    safe_name = f"{dtype.value}.upload.{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}{suffix}"
    file_path = upload_dir / safe_name
    file_path.write_bytes(content)

    svc = DataSyncService(session)
    record = await svc.create(
        type=dtype,
        filename=safe_name,
        hash=h,
        record_count=int(record_count),
        file_size=file_size,
        content=content,
    )

    return record, content


@router.post(
    "/product/import",
    operation_id="importProductFile",
    summary="Import product data file",
    response_model=DataSyncCreateResponse,
)
async def import_product_file(
    file: UploadFile = File(..., alias="file"),
    session: AsyncSession = Depends(get_db_session),
):
    """Upload a product file and create a data sync record."""

    record, content = await _handle_upload(session, file, DataType.PRODUCT)

    # Extract record fields to avoid lazy loading issues after session commits
    record_id = record.id
    record_filename = record.filename

    # parse XML and insert raw product rows; return number of imported rows
    imported_count: int | None = None
    try:
        root = ET.fromstring(content)
        dev_raw = root.get("developer_id")
        developer_id = int(dev_raw) if dev_raw else None
        entries = []
        for el in root.findall(".//product_list_entry"):
            entries.append({
                "developer_id": developer_id,
                "product_id": int(el.get("product_id")) if el.get("product_id") else None,
                "product_name": el.get("product_name", ""),
                "price": el.get("price", ""),
                "profit": el.get("profit", ""),
                "visible": el.get("visible", ""),
                "old_sales": el.get("old_sales", ""),
                "new_sales": el.get("new_sales", ""),
                "total_sales": el.get("total_sales", ""),
                "derived_product_sales": el.get("derived_product_sales", ""),
                "direct_sales": el.get("direct_sales", ""),
                "indirect_sales": el.get("indirect_sales", ""),
                "promoted_sales": el.get("promoted_sales", ""),
                "cart_adds": el.get("cart_adds", ""),
                "wishlist_adds": el.get("wishlist_adds", ""),
                "organic_impressions": el.get("organic_impressions", ""),
                "paid_impressions": el.get("paid_impressions", ""),
            })

        svc2 = DataSyncService(session)
        snapshot = getattr(record, "uploaded_at", None)
        snapshot_date = snapshot.date() if snapshot is not None else date.today()
        imported_count = await svc2.add_raw_product_list(sync_record_id=record_id, snapshot_date=snapshot_date, records=entries)
    except ET.ParseError as exc:
        logger.exception("Failed to parse product XML for DataSyncRecord id=%s: %s", record_id, exc)
        imported_count = 0
    except Exception as exc:  # pragma: no cover - unexpected errors
        logger.exception("Unexpected error while importing product XML for DataSyncRecord id=%s", record_id)
        imported_count = 0

    return DataSyncCreateResponse(id=record_id, filename=record_filename, imported_count=imported_count)


@router.post(
    "/income/import",
    operation_id="importIncomeFile",
    summary="Import income data file",
    response_model=DataSyncCreateResponse,
)
async def import_income_file(
    file: UploadFile = File(..., alias="file"),
    session: AsyncSession = Depends(get_db_session),
):
    """Upload an income file and create a data sync record."""

    record, content = await _handle_upload(session, file, DataType.INCOME)

    # Extract record fields to avoid lazy loading issues after session commits
    record_id = record.id
    record_filename = record.filename

    # parse XML and insert raw income rows; return number of imported rows
    imported_count: int | None = None
    try:
        root = ET.fromstring(content)
        dev_raw = root.get("developer_id")
        developer_id = int(dev_raw) if dev_raw else None
        entries = []
        for el in root.findall(".//developer_income_entry"):
            # parse purchase_date into datetime; fallback to now if missing
            pd_raw = el.get("purchase_date")
            try:
                purchase_dt = datetime.fromisoformat(pd_raw) if pd_raw else datetime.utcnow()
            except Exception:
                purchase_dt = datetime.utcnow()

            entries.append({
                "developer_id": developer_id,
                "sales_log_id": int(el.get("sales_log_id")) if el.get("sales_log_id") else None,
                "buyer_id": int(el.get("buyer_id")) if el.get("buyer_id") else None,
                "buyer_name": el.get("buyer_name", ""),
                "recipient_id": int(el.get("recipient_id")) if el.get("recipient_id") else None,
                "recipient_name": el.get("recipient_name", ""),
                "reseller_id": el.get("reseller_id", ""),
                "reseller_name": el.get("reseller_name", ""),
                "product_id": int(el.get("product_id")) if el.get("product_id") else None,
                "product_name": el.get("product_name", ""),
                "price_factor": el.get("price_factor", ""),
                "paid_credits": el.get("paid_credits", ""),
                "paid_promo_credits": el.get("paid_promo_credits", ""),
                "income_credits": el.get("income_credits", ""),
                "income_promo_credits": el.get("income_promo_credits", ""),
                "purchase_date": purchase_dt,
                "credit_delivery_date": el.get("credit_delivery_date", ""),
            })

        svc2 = DataSyncService(session)
        snapshot = getattr(record, "uploaded_at", None)
        snapshot_date = snapshot.date() if snapshot is not None else date.today()
        imported_count = await svc2.add_raw_income_log(sync_record_id=record_id, snapshot_date=snapshot_date, records=entries)
    except ET.ParseError as exc:
        logger.exception("Failed to parse income XML for DataSyncRecord id=%s: %s", record_id, exc)
        imported_count = 0
    except Exception as exc:  # pragma: no cover - unexpected errors
        logger.exception("Unexpected error while importing income XML for DataSyncRecord id=%s", record_id)
        imported_count = 0

    return DataSyncCreateResponse(id=record_id, filename=record_filename, imported_count=imported_count)


@router.get(
    "/by-hash",
    operation_id="getDataSyncRecordByHash",
    summary="Check whether a DataSyncRecord with given hash exists",
    response_model=DataSyncRecordByHashResponse,
)
async def get_data_sync_record_by_hash(
    hash: str = Query(..., description="File hash to check"),
    session: AsyncSession = Depends(get_db_session),
):
    """Return existence flag and the most recent matching record when present.

    Always returns HTTP 200. When a record exists, `exists` is true and
    `record` contains the first matching item's metadata. When no record is
    found, returns `{ "exists": false }`.
    """

    svc = DataSyncService(session)
    record = await svc.get_by_hash(hash)
    if not record:
        return {"exists": False}

    item = DataSyncRecordListItem(
        id=record.id,
        uploaded_at=record.uploaded_at,
        type=record.type,
        filename=record.filename,
        hash=record.hash,
        record_count=record.record_count,
        file_size=record.file_size,
    )

    return {"exists": True, "record": item}


@router.delete(
    "/object",
    operation_id="deleteDataSyncRecord",
    summary="Delete a DataSyncRecord by ID",
)
async def delete_data_sync_record(
    id: int = Query(..., description="ID of the DataSyncRecord to delete"),
    session: AsyncSession = Depends(get_db_session),
):
    """Delete a DataSyncRecord by its ID and return deletion result.

    Returns HTTP 200 with `{ "deleted": true }` on success, or
    HTTP 404 when the record does not exist.
    """

    svc = DataSyncService(session)
    # remove any raw rows associated with this sync record first
    try:
        raw_deleted = await svc.delete_raw_by_sync_record(id)
        income_deleted = await svc.delete_raw_income_by_sync_record(id)
        logger.info("Deleted raw rows for DataSyncRecord id=%s: raw=%s, income=%s", id, raw_deleted, income_deleted)
    except Exception:  # pragma: no cover - best-effort cleanup, do not block final deletion
        logger.exception("Failed to delete raw rows for DataSyncRecord id=%s", id)

    deleted = await svc.delete(id)
    if not deleted:
        return {"deleted": False, "message": "Object is not existed"}

    return {"deleted": True}
