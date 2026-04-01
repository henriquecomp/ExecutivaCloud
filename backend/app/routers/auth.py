from typing import Any, Optional

from fastapi import APIRouter, Body, Depends, Header, HTTPException, status

from app.api.deps import get_current_user
from app.models import user_model as user_models
from app.schemas import auth_schema as schemas
from app.schemas.executive_schema import ExecutiveCreate
from app.services.auth_service import AuthService, _user_to_public
from app.services.invite_service import InviteService

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


@router.post("/invite-user", response_model=schemas.InviteUserResponse, status_code=status.HTTP_201_CREATED)
def invite_user(
    body: schemas.InviteUserRequest,
    current: user_models.Usuario = Depends(get_current_user),
    service: InviteService = Depends(InviteService),
):
    return service.invite_user(current, body)


@router.get("/invite-status", response_model=schemas.InviteTokenStatusResponse)
def invite_status(token: str, service: InviteService = Depends(InviteService)):
    return service.invite_token_status(token)


@router.post("/complete-invite", response_model=schemas.TokenResponse)
def complete_invite(body: schemas.CompleteInviteRequest, service: InviteService = Depends(InviteService)):
    return service.complete_invite(body)


@router.post("/complete-profile/executive", response_model=schemas.CurrentUserOut)
def complete_profile_executive(
    body: ExecutiveCreate,
    current: user_models.Usuario = Depends(get_current_user),
    service: InviteService = Depends(InviteService),
):
    if not current.needs_profile_completion:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O perfil deste usuário já foi concluído.",
        )
    return service.complete_executive_profile(current, body)


@router.post("/complete-profile/secretary", response_model=schemas.CurrentUserOut)
def complete_profile_secretary(
    body: dict[str, Any] = Body(...),
    current: user_models.Usuario = Depends(get_current_user),
    service: InviteService = Depends(InviteService),
):
    if not current.needs_profile_completion:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O perfil deste usuário já foi concluído.",
        )
    return service.complete_secretary_profile(current, body)
