from fastapi import APIRouter, Depends, HTTPException, status
from app.services.legal_organization_service import LegalOrganizationService
from app.schemas import legal_organization_schema as schemas
from typing import List, Dict, Any

router = APIRouter(
    prefix="/legal-organizations",
    tags=["Legal Organizations"]
)

@router.post("/", response_model=schemas.LegalOrganization, status_code=status.HTTP_201_CREATED)
def create_legal_organization(
    org: schemas.LegalOrganizationCreate, 
    service: LegalOrganizationService = Depends(LegalOrganizationService)
):
    """
    Cria uma nova Organização Matriz (Pessoa Jurídica).
    """
    try:
        return service.create_legal_organization(org)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=List[schemas.LegalOrganization])
def get_all_legal_organizations(
    skip: int = 0, 
    limit: int = 100,
    service: LegalOrganizationService = Depends(LegalOrganizationService)
):
    """
    Lista todas as Organizações Matriz.
    """
    return service.get_all_legal_organizations(skip=skip, limit=limit)

@router.get("/{org_id}", response_model=schemas.LegalOrganization)
def get_legal_organization(
    org_id: int, 
    service: LegalOrganizationService = Depends(LegalOrganizationService)
):
    """
    Busca uma Organização Matriz pelo ID.
    """
    db_org = service.get_legal_organization(org_id)
    if db_org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organização não encontrada")
    return db_org

@router.put("/{org_id}", response_model=schemas.LegalOrganization)
def update_legal_organization(
    org_id: int, 
    org_data: schemas.LegalOrganizationUpdate,
    service: LegalOrganizationService = Depends(LegalOrganizationService)
):
    """
    Atualiza uma Organização Matriz.
    """
    try:
        updated_org = service.update_legal_organization(org_id, org_data)
        return updated_org
    except ValueError as e:
        # Erro pode ser "Não encontrado" (404) ou "Valor inválido" (400)
        if "não encontrada" in str(e):
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{org_id}", response_model=Dict[str, str])
def delete_legal_organization(
    org_id: int,
    service: LegalOrganizationService = Depends(LegalOrganizationService)
):
    """
    Deleta uma Organização Matriz.
    """
    try:
        return service.delete_legal_organization(org_id)
    except ValueError as e:
        if "não encontrada" in str(e):
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        # Ex: Erro por ter empresas filhas
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))