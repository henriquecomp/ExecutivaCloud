from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.models import user_model as user_models
from app.schemas import user_schema as schemas
from app.services.user_management_service import UserManagementService


router = APIRouter(prefix="/users/management", tags=["users-management"])


@router.get("/", response_model=schemas.UserManagementListResponse)
def list_managed_users(
    q: Optional[str] = Query(None, description="Busca por nome ou e-mail"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current: user_models.Usuario = Depends(get_current_user),
    service: UserManagementService = Depends(UserManagementService),
):
    rows, total = service.list_users(current, q=q, skip=skip, limit=limit)
    return schemas.UserManagementListResponse(items=rows, total=total)


@router.get("/{user_id}", response_model=schemas.Usuario)
def get_managed_user(
    user_id: int,
    current: user_models.Usuario = Depends(get_current_user),
    service: UserManagementService = Depends(UserManagementService),
):
    return service.get_user(current, user_id)


@router.patch("/{user_id}", response_model=schemas.Usuario)
def patch_managed_user(
    user_id: int,
    body: schemas.UserManagementPatch,
    current: user_models.Usuario = Depends(get_current_user),
    service: UserManagementService = Depends(UserManagementService),
):
    return service.patch_user(current, user_id, body)


@router.post("/{user_id}/deactivate", response_model=schemas.Usuario)
def deactivate_managed_user(
    user_id: int,
    current: user_models.Usuario = Depends(get_current_user),
    service: UserManagementService = Depends(UserManagementService),
):
    return service.deactivate_user(current, user_id)
