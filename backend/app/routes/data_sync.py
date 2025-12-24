
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
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db_session
from app.models.data_sync import DataType
from app.services import DataSyncService

router = APIRouter(prefix="/data-sync", tags=["DataSync"])


class DataSyncCreateResponse(BaseModel):
    """Response returned after successfully creating a DataSyncRecord."""

    id: int
    filename: str


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

    return record


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

    record = await _handle_upload(session, file, DataType.PRODUCT)
    return DataSyncCreateResponse(id=int(record.id), filename=record.filename)


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

    record = await _handle_upload(session, file, DataType.INCOME)
    return DataSyncCreateResponse(id=int(record.id), filename=record.filename)


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
