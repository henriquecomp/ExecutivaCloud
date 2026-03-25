from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.api.deps import get_current_user
from app.models import user_model as user_models
from app.schemas import auth_schema as schemas
from app.services.auth_service import AuthService, _user_to_public

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=schemas.TokenResponse)
def login(body: schemas.LoginRequest, service: AuthService = Depends(AuthService)):
    return service.login(body.email, body.password)


@router.post("/register-organization", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def register_organization(
    body: schemas.RegisterOrganizationRequest,
    service: AuthService = Depends(AuthService),
):
    """Cadastro público: organização jurídica + administrador da organização."""
    return service.register_organization(body)


@router.post("/bootstrap-master", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def bootstrap_master(
    body: schemas.BootstrapMasterRequest,
    x_setup_token: Optional[str] = Header(None, alias="X-Setup-Token"),
    service: AuthService = Depends(AuthService),
):
    """
    Cria o primeiro usuário master (requer EXECUTIVA_SETUP_TOKEN no servidor e header X-Setup-Token).
    Só funciona se ainda não existir nenhum master.
    """
    return service.bootstrap_master(x_setup_token, body)


@router.get("/me", response_model=schemas.CurrentUserOut)
def me(current: user_models.Usuario = Depends(get_current_user)):
    return _user_to_public(current)
