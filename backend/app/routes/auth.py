from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db_session
from app.services.refresh_token_service import RefreshTokenService
from app.security.jwt import create_access_token, generate_refresh_token, refresh_expires_at, hash_token
from app.services.user_service import UserService


router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    username: str
    password_hash: str


class UserOut(BaseModel):
    id: int
    username: str
    is_admin: bool
    is_active: bool
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None


class LoginResponse(BaseModel):
    success: bool
    user: Optional[UserOut] = None


class RefreshRequest(BaseModel):
    refresh_token: str


class RefreshResponse(BaseModel):
    success: bool
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None


@router.get(
    "/me",
    response_model=UserOut,
    operation_id="current_user",
    summary="Get current authenticated user",
)
async def current_user(
    request: Request,
    session: AsyncSession = Depends(get_db_session),
):
    principal = getattr(request.state, "principal", None)
    if principal is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    svc = UserService(session)
    user = await svc.get_by_id(principal.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return UserOut(
        id=user.id,
        username=user.username,
        is_admin=bool(user.is_admin),
        is_active=bool(user.is_active),
        last_login_at=user.last_login_at,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.post(
    "/login", response_model=LoginResponse, operation_id="login", summary="Authenticate user"
)
async def login(
    req: LoginRequest,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
):
    svc = UserService(session)

    user = await svc.get_by_username_and_password_hash(req.username, req.password_hash)
    if user is None:
        return LoginResponse(success=False, user=None)

    # update last login timestamp
    now = datetime.now(timezone.utc)
    await svc.update_last_login_by_id(user.id, now)

    user_out = UserOut(
        id=user.id,
        username=user.username,
        is_admin=bool(user.is_admin),
        is_active=bool(user.is_active),
        last_login_at=user.last_login_at,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )

    # issue tokens
    access_token = create_access_token(user.id, user.username)
    refresh_token = generate_refresh_token()

    # persist refresh token (store hash)
    rsvc = RefreshTokenService(session)
    rt_hash = hash_token(refresh_token)
    expires_at = refresh_expires_at()

    user_agent = request.headers.get("user-agent")
    ip_address = None
    try:
        ip_address = request.client.host
    except Exception:
        ip_address = None

    await rsvc.create(user_id=user.id, token_hash=rt_hash, expires_at=expires_at, user_agent=user_agent, ip_address=ip_address)

    user_out.access_token = access_token
    user_out.refresh_token = refresh_token

    return LoginResponse(success=True, user=user_out)



@router.post(
    "/refresh",
    response_model=RefreshResponse,
    operation_id="refresh",
    summary="Refresh access token",
)
async def refresh_token(
    req: RefreshRequest,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
):
    # validate existing refresh token record (opaque token lookup)
    rsvc = RefreshTokenService(session)
    incoming_hash = hash_token(req.refresh_token)
    rec = await rsvc.get_by_hash(incoming_hash)
    now = datetime.now(timezone.utc)

    def _ensure_aware(dt: datetime | None) -> datetime | None:
        if dt is None:
            return None
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt

    expires_at = _ensure_aware(rec.expires_at) if rec else None

    if rec is None or rec.revoked_at is not None or expires_at is None or expires_at <= now:
        return RefreshResponse(success=False, access_token=None, refresh_token=None)

    # find user and username
    usvc = UserService(session)
    user = await usvc.get_by_id(rec.user_id)
    username = user.username if user is not None else ""

    # revoke current refresh token (rotation)
    await rsvc.revoke_by_hash(incoming_hash, revoked_at=now)

    # issue new tokens (rotate refresh token)
    access_token = create_access_token(rec.user_id, username)
    new_refresh = generate_refresh_token()

    # persist new refresh token
    new_hash = hash_token(new_refresh)
    expires_at = refresh_expires_at()

    user_agent = request.headers.get("user-agent")
    ip_address = None
    try:
        ip_address = request.client.host
    except Exception:
        ip_address = None

    await rsvc.create(user_id=rec.user_id, token_hash=new_hash, expires_at=expires_at, user_agent=user_agent, ip_address=ip_address)

    return RefreshResponse(success=True, access_token=access_token, refresh_token=new_refresh)
