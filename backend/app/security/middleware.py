# app/security/middleware.py
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.security.policy import is_public_path
from app.security.jwt import decode_token
from app.security.models import Principal


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        root_path = (request.scope.get("root_path") or "").rstrip("/")

        # 兼容 root_path 或反向代理前缀：先尝试去掉前缀再匹配公开路径
        candidates = [path]
        if root_path and path.startswith(root_path):
            stripped = path[len(root_path):] or "/"
            candidates.append(stripped)

        # 放行公开路径
        if any(is_public_path(p) for p in candidates):
            return await call_next(request)

        # 解析 Bearer token
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return JSONResponse({"detail": "Not authenticated"}, status_code=401)

        token = auth.removeprefix("Bearer ").strip()

        # 校验 token（签名、exp 等）并确保这是访问令牌
        try:
            payload = decode_token(token)
        except Exception:
            return JSONResponse({"detail": "Invalid token"}, status_code=401)

        if payload.get("typ") != "access":
            return JSONResponse({"detail": "Invalid token type"}, status_code=401)

        # 注入上下文：业务完全无感
        try:
            user_id = int(payload["sub"])
        except Exception:
            return JSONResponse({"detail": "Invalid token payload"}, status_code=401)

        request.state.principal = Principal(user_id=user_id, user_name=str(payload.get("name", "")))

        return await call_next(request)
