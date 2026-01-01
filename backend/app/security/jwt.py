from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt
import secrets
import hashlib


# Config from environment with safe defaults for development
SECRET_KEY = os.getenv("IMVU_JWT_SECRET", "dev-secret-change-me")
ALGORITHM = os.getenv("IMVU_JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("IMVU_ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("IMVU_REFRESH_TOKEN_EXPIRE_DAYS", "7"))


def _now_utc() -> datetime:
	return datetime.now(timezone.utc)


def _expires_at(minutes: int = 0, days: int = 0) -> datetime:
	return _now_utc() + timedelta(minutes=minutes, days=days)


def create_access_token(user_id: int, username: str, expires_minutes: int | None = None) -> str:
	"""Create a JWT access token containing `sub` (user id) and `name` (username).

	The token will be signed with `SECRET_KEY` and use `ALGORITHM`.
	"""
	if expires_minutes is None:
		expires_minutes = ACCESS_TOKEN_EXPIRE_MINUTES

	now = _now_utc()
	exp = _expires_at(minutes=expires_minutes)

	payload: dict[str, Any] = {
		"sub": str(user_id),
		"name": username,
		"iat": int(now.timestamp()),
		"exp": int(exp.timestamp()),
		"typ": "access",
	}

	return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def generate_refresh_token() -> str:
	"""Generate a secure opaque refresh token string (not a JWT)."""
	return secrets.token_urlsafe(32)


def refresh_expires_at() -> datetime:
	return _now_utc() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)


def hash_token(token: str) -> str:
	return hashlib.sha256(token.encode()).hexdigest()


def decode_token(token: str) -> dict[str, Any]:
	return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
