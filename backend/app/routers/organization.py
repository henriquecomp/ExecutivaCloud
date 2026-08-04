from fastapi import APIRouter, Depends, HTTPException, status
from app.services.organization_service import OrganizationService
from app.schemas import organization_schema as schemas
from app.api.deps import get_current_user
from app.models import user_model as user_models
from typing import List, Dict

router = APIRouter(
    prefix="/organizations",
    tags=["Organizations (Companies)"]
)


@router.post("/", response_model=schemas.Organization, status_code=status.HTTP_201_CREATED)
def create_organization(
    org: schemas.OrganizationCreate,
    current: user_models.Usuario = Depends(get_current_user),
    service: OrganizationService = Depends(OrganizationService),
):
    """
    Cria uma nova Empresa (Filial).
    """
    try:
        return service.create_organization(org, current)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=List[schemas.Organization])
def get_all_organizations(
    skip: int = 0,
    limit: int = 100,
    current: user_models.Usuario = Depends(get_current_user),
    service: OrganizationService = Depends(OrganizationService),
):
    """
    Lista Empresas no escopo do usuário autenticado.
    """
    return service.get_all_organizations(current, skip=skip, limit=limit)


@router.get("/{org_id}", response_model=schemas.Organization)
def get_organization(
    org_id: int,
    current: user_models.Usuario = Depends(get_current_user),
    service: OrganizationService = Depends(OrganizationService),
):
    """
    Busca uma Empresa pelo ID.
    """
    try:
        db_org = service.get_organization(org_id, current)
    except HTTPException:
        raise
    if db_org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada")
    return db_org


@router.put("/{org_id}", response_model=schemas.Organization)
def update_organization(
    org_id: int,
    org_data: schemas.OrganizationUpdate,
    current: user_models.Usuario = Depends(get_current_user),
    service: OrganizationService = Depends(OrganizationService),
):
    """
    Atualiza uma Empresa.
    """
    try:
        return service.update_organization(org_id, org_data, current)
    except HTTPException:
        raise
    except ValueError as e:
        if "não encontrada" in str(e):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{org_id}", response_model=Dict[str, str])
def delete_organization(
    org_id: int,
    current: user_models.Usuario = Depends(get_current_user),
    service: OrganizationService = Depends(OrganizationService),
):
    """
    Deleta uma Empresa.
    """
    try:
        return service.delete_organization(org_id, current)
    except HTTPException:
        raise
    except ValueError as e:
        if "não encontrada" in str(e):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
