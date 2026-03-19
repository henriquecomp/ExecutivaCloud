from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas import contact_type_schema as schemas
from app.services.contact_type_service import ContactTypeService


router = APIRouter(prefix="/contact-types", tags=["Contact Types"])


@router.post("/", response_model=schemas.ContactType, status_code=status.HTTP_201_CREATED)
def create_contact_type(
    payload: schemas.ContactTypeCreate,
    service: ContactTypeService = Depends(),
):
    try:
        return service.create_contact_type(payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@router.get("/", response_model=List[schemas.ContactType])
def list_contact_types(
    skip: int = 0,
    limit: int = 1000,
    service: ContactTypeService = Depends(),
):
    return service.get_all_contact_types(skip=skip, limit=limit)


@router.get("/{contact_type_id}", response_model=schemas.ContactType)
def get_contact_type(
    contact_type_id: int,
    service: ContactTypeService = Depends(),
):
    contact_type = service.get_contact_type(contact_type_id)
    if not contact_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tipo de contato não encontrado.")
    return contact_type


@router.put("/{contact_type_id}", response_model=schemas.ContactType)
def update_contact_type(
    contact_type_id: int,
    payload: schemas.ContactTypeUpdate,
    service: ContactTypeService = Depends(),
):
    try:
        return service.update_contact_type(contact_type_id, payload)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_404_NOT_FOUND if "não encontrado" in detail else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail)


@router.delete("/{contact_type_id}")
def delete_contact_type(
    contact_type_id: int,
    service: ContactTypeService = Depends(),
):
    try:
        return service.delete_contact_type(contact_type_id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
