# app/security/middleware.py
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.security.policy import is_docs_path, is_public_path
from app.security.jwt import decode_token
from app.security.models import Principal
from app.core.config import get_settings


_ENV = (get_settings().app.env or "dev").lower()


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        root_path = (request.scope.get("root_path") or "").rstrip("/")

        # Handle root_path or reverse proxy prefix by stripping prefix before matching public paths
        candidates = [path]
        if root_path and path.startswith(root_path):
            stripped = path[len(root_path):] or "/"
            candidates.append(stripped)

        # Allow public paths
        if any(is_docs_path(p) for p in candidates) and _ENV != "dev":
            return JSONResponse({"detail": "API docs are disabled outside development."}, status_code=404)

        if any(is_public_path(p) for p in candidates):
            return await call_next(request)

        # Parse Bearer token
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return JSONResponse({"detail": "Not authenticated"}, status_code=401)

        token = auth.removeprefix("Bearer ").strip()

        # Validate token signature/expiry and ensure it is an access token
        try:
            payload = decode_token(token)
        except Exception:
            return JSONResponse({"detail": "Invalid token"}, status_code=401)

        if payload.get("typ") != "access":
            return JSONResponse({"detail": "Invalid token type"}, status_code=401)

        # Inject principal into request context
        try:
            user_id = int(payload["sub"])
        except Exception:
            return JSONResponse({"detail": "Invalid token payload"}, status_code=401)

        request.state.principal = Principal(user_id=user_id, user_name=str(payload.get("name", "")))

        return await call_next(request)
