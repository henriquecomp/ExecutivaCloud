from typing import List, Dict

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas import event_type_schema as schemas
from app.services.event_type_service import EventTypeService

router = APIRouter(prefix="/event-types", tags=["Event Types"])


@router.get("/", response_model=List[schemas.EventType])
def get_all_event_types(
    skip: int = 0,
    limit: int = 1000,
    service: EventTypeService = Depends(EventTypeService),
):
    return service.get_all_event_types(skip=skip, limit=limit)


@router.get("/{event_type_id}", response_model=schemas.EventType)
def get_event_type(
    event_type_id: int,
    service: EventTypeService = Depends(EventTypeService),
):
    db_item = service.get_event_type(event_type_id)
    if not db_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tipo de evento não encontrado.")
    return db_item


@router.post("/", response_model=schemas.EventType, status_code=status.HTTP_201_CREATED)
def create_event_type(
    payload: schemas.EventTypeCreate,
    service: EventTypeService = Depends(EventTypeService),
):
    try:
        return service.create_event_type(payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@router.put("/{event_type_id}", response_model=schemas.EventType)
def update_event_type(
    event_type_id: int,
    payload: schemas.EventTypeUpdate,
    service: EventTypeService = Depends(EventTypeService),
):
    try:
        return service.update_event_type(event_type_id, payload)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_404_NOT_FOUND if "não encontrado" in detail else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail)


@router.delete("/{event_type_id}", response_model=Dict[str, str])
def delete_event_type(
    event_type_id: int,
    service: EventTypeService = Depends(EventTypeService),
):
    try:
        return service.delete_event_type(event_type_id)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_404_NOT_FOUND if "não encontrado" in detail else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail)
