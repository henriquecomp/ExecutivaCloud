from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status

from app.services.secretary_service import SecretaryService

router = APIRouter(prefix="/secretaries", tags=["Secretaries"])


@router.get("/", response_model=List[Dict[str, Any]])
def list_secretaries(
    skip: int = 0,
    limit: int = 2000,
    service: SecretaryService = Depends(SecretaryService),
):
    return service.list_secretaries(skip=skip, limit=limit)


@router.get("/{secretary_id}", response_model=Dict[str, Any])
def get_secretary(secretary_id: int, service: SecretaryService = Depends(SecretaryService)):
    return service.get_secretary(secretary_id)


@router.post("/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_secretary(
    body: Dict[str, Any],
    service: SecretaryService = Depends(SecretaryService),
):
    try:
        return service.create_secretary(body)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{secretary_id}", response_model=Dict[str, Any])
def update_secretary(
    secretary_id: int,
    body: Dict[str, Any],
    service: SecretaryService = Depends(SecretaryService),
):
    try:
        return service.update_secretary(secretary_id, body)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{secretary_id}", response_model=Dict[str, str])
def delete_secretary(secretary_id: int, service: SecretaryService = Depends(SecretaryService)):
    return service.delete_secretary(secretary_id)
