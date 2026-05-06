"""Origens permitidas (CORS e links de convite/redefinição a partir do browser)."""

from __future__ import annotations

import os
import re
from urllib.parse import urlparse

_ALWAYS_ALLOW = ("http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001")

# Regex cobre qualquer porta do Vite/Webpack (ex.: 3000, 5173) sem depender só da lista acima
LOCAL_ORIGIN_REGEX = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"
LOCAL_ORIGIN_RE = re.compile(LOCAL_ORIGIN_REGEX)


def get_cors_origins() -> list[str]:
    """Lista de origens exatas para CORSMiddleware.allow_origins (mesma regra que antes em main)."""
    _cors = os.getenv("CORS_ORIGINS", "").strip()
    if _cors:
        origins = [o.strip() for o in _cors.split(",") if o.strip()]
        for o in _ALWAYS_ALLOW:
            if o not in origins:
                origins.append(o)
        return origins
    return [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:80",
        "http://127.0.0.1:80",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]


def origin_is_allowed(origin: str) -> bool:
    if not origin:
        return False
    origins = get_cors_origins()
    return origin in origins or bool(LOCAL_ORIGIN_RE.match(origin))


def is_allowed_frontend_base_url(url: str) -> bool:
    """True se a URL for http(s) com host e a origem estiver na política CORS."""
    try:
        parsed = urlparse(url.strip())
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            return False
        origin = f"{parsed.scheme}://{parsed.netloc}"
        return origin_is_allowed(origin)
    except Exception:
        return False


def normalize_and_validate_frontend_base_url(header_value: str | None) -> str:
    """
    Valida X-Frontend-Base-URL e devolve a base normalizada (sem barra final).
    Levanta ValueError se ausente ou não permitido.
    """
    if header_value is None or not str(header_value).strip():
        raise ValueError("missing")
    raw = str(header_value).strip()
    if "\n" in raw or "\r" in raw or "\t" in raw:
        raise ValueError("invalid")
    parsed = urlparse(raw)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError("invalid")
    origin = f"{parsed.scheme}://{parsed.netloc}"
    if not origin_is_allowed(origin):
        raise ValueError("not_allowed")
    path = (parsed.path or "").rstrip("/")
    base = f"{origin}{path}" if path else origin
    return base
