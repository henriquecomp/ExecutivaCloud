from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas import contact_schema as schemas
from app.services.contact_service import ContactService


router = APIRouter(prefix="/contacts", tags=["Contacts"])


@router.post("/", response_model=schemas.Contact, status_code=status.HTTP_201_CREATED)
def create_contact(
    payload: schemas.ContactCreate,
    service: ContactService = Depends(),
):
    try:
        return service.create_contact(payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@router.get("/", response_model=List[schemas.Contact])
def list_contacts(
    skip: int = 0,
    limit: int = 1000,
    executive_id: Optional[int] = None,
    service: ContactService = Depends(),
):
    return service.get_all_contacts(skip=skip, limit=limit, executive_id=executive_id)


@router.get("/{contact_id}", response_model=schemas.Contact)
def get_contact(
    contact_id: int,
    service: ContactService = Depends(),
):
    contact = service.get_contact(contact_id)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contato não encontrado.")
    return contact


@router.put("/{contact_id}", response_model=schemas.Contact)
def update_contact(
    contact_id: int,
    payload: schemas.ContactUpdate,
    service: ContactService = Depends(),
):
    try:
        return service.update_contact(contact_id, payload)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_404_NOT_FOUND if "não encontrado" in detail else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail)


@router.delete("/{contact_id}")
def delete_contact(
    contact_id: int,
    service: ContactService = Depends(),
):
    try:
        return service.delete_contact(contact_id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
