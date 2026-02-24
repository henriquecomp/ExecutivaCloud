from fastapi import APIRouter, Depends, HTTPException, status
from app.services.organization_service import OrganizationService
from app.schemas import organization_schema as schemas
from typing import List, Dict, Any

router = APIRouter(
    prefix="/organizations",
    tags=["Organizations (Companies)"]
)

@router.post("/", response_model=schemas.Organization, status_code=status.HTTP_201_CREATED)
def create_organization(
    org: schemas.OrganizationCreate, 
    service: OrganizationService = Depends(OrganizationService)
):
    try:
        return service.create_organization(org)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=List[schemas.Organization])
def get_all_organizations(
    skip: int = 0, 
    limit: int = 1000,
    service: OrganizationService = Depends(OrganizationService)
):
    return service.get_all_organizations(skip=skip, limit=limit)

@router.get("/{org_id}", response_model=schemas.Organization)
def get_organization(
    org_id: int, 
    service: OrganizationService = Depends(OrganizationService)
):
    db_org = service.get_organization(org_id)
    if db_org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada")
    return db_org

@router.put("/{org_id}", response_model=schemas.Organization)
def update_organization(
    org_id: int, 
    org_data: schemas.OrganizationUpdate,
    service: OrganizationService = Depends(OrganizationService)
):
    try:
        return service.update_organization(org_id, org_data)
    except ValueError as e:
        if "não encontrada" in str(e):
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{org_id}", response_model=Dict[str, str])
def delete_organization(
    org_id: int,
    service: OrganizationService = Depends(OrganizationService)
):
    try:
        return service.delete_organization(org_id)
    except ValueError as e:
        if "não encontrada" in str(e):
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))