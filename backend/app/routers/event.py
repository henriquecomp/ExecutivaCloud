from datetime import datetime
from typing import List, Optional, Dict

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas import event_schema as schemas
from app.services.event_service import EventService

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("/", response_model=List[schemas.Event])
def get_all_events(
    skip: int = 0,
    limit: int = 1000,
    executive_id: Optional[int] = None,
    service: EventService = Depends(EventService),
):
    return service.get_all_events(skip=skip, limit=limit, executive_id=executive_id)


@router.get("/{event_id}", response_model=schemas.Event)
def get_event(
    event_id: int,
    service: EventService = Depends(EventService),
):
    db_item = service.get_event(event_id)
    if not db_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado.")
    return db_item


@router.post("/", response_model=schemas.Event, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: schemas.EventCreate,
    service: EventService = Depends(EventService),
):
    try:
        return service.create_event(payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@router.post("/bulk", response_model=List[schemas.Event], status_code=status.HTTP_201_CREATED)
def create_events_bulk(
    payloads: List[schemas.EventCreate],
    service: EventService = Depends(EventService),
):
    try:
        return service.create_many_events(payloads)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@router.put("/{event_id}", response_model=schemas.Event)
def update_event(
    event_id: int,
    payload: schemas.EventUpdate,
    service: EventService = Depends(EventService),
):
    try:
        return service.update_event(event_id, payload)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_404_NOT_FOUND if "não encontrado" in detail else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail)


@router.delete("/{event_id}", response_model=Dict[str, str])
def delete_event(
    event_id: int,
    service: EventService = Depends(EventService),
):
    try:
        return service.delete_event(event_id)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_404_NOT_FOUND if "não encontrado" in detail else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail)


@router.delete("/recurrence/{recurrence_id}", response_model=schemas.RecurrenceDeleteResult)
def delete_events_by_recurrence(
    recurrence_id: str,
    from_start_time: Optional[datetime] = None,
    service: EventService = Depends(EventService),
):
    result = service.delete_by_recurrence(recurrence_id=recurrence_id, from_start_time=from_start_time)
    return result
