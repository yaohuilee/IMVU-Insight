# app/security/policy.py
import re

from app.core.config import get_settings

# Base public endpoints that remain accessible in all modes.
BASE_ALLOWLIST = [
    r"^/auth/login$",
    r"^/auth/refresh$",
    r"^/health/db$",
    r"^/health$",
    r"^/favicon\.ico$",
    r"^/$",
]

# Public endpoints that are only exposed during development.
DEV_ONLY_ALLOWLIST = [
    r"^/docs$",
    r"^/openapi\.json$",
]

_ENV = (get_settings().app.env or "dev").lower()


def _allowlist() -> list[str]:
    if _ENV == "dev":
        return BASE_ALLOWLIST + DEV_ONLY_ALLOWLIST
    return BASE_ALLOWLIST


def is_public_path(path: str) -> bool:
    return any(re.match(p, path) for p in _allowlist())


def is_docs_path(path: str) -> bool:
    return any(re.match(p, path) for p in DEV_ONLY_ALLOWLIST)
