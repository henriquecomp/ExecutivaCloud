from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models import user_model as user_models
from app.repositories.user_repository import UserRepository

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    db: Session = Depends(get_db),
) -> user_models.Usuario:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não autenticado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_token(credentials.credentials)
        uid = int(payload["sub"])
    except (JWTError, KeyError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = UserRepository(db).get_by_id(uid)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário inválido.",
        )
    return user


def get_invite_frontend_base(
    x_frontend_base_url: Optional[str] = Header(None, alias="X-Frontend-Base-URL"),
) -> str:
    """Base pública do SPA (convites / primeiro acesso / reset), validada contra CORS."""
    from app.core.allowed_origins import normalize_and_validate_frontend_base_url

    try:
        return normalize_and_validate_frontend_base_url(x_frontend_base_url)
    except ValueError as exc:
        code = str(exc)
        if code == "not_allowed":
            detail = "URL do sistema não permitida. Use a mesma origem autorizada pelo CORS."
        else:
            detail = (
                "Não foi possível determinar a URL pública do sistema. "
                "Acesse pela aplicação no navegador (cabeçalho X-Frontend-Base-URL)."
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc
