# app/security/policy.py
import re

ALLOWLIST = [
    r"^/auth/login$",
    r"^/auth/refresh$",
    r"^/docs$",
    r"^/openapi\.json$",
    r"^/health$",
]


def is_public_path(path: str) -> bool:
    return any(re.match(p, path) for p in ALLOWLIST)
