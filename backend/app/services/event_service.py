from datetime import datetime
from typing import List, Optional

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import event_model as models
from app.repositories.event_repository import EventRepository
from app.repositories.event_type_repository import EventTypeRepository
from app.repositories.executive_repository import ExecutiveRepository
from app.schemas import event_schema as schemas


class EventService:
    def __init__(self, db: Session = Depends(get_db)):
        self.event_repo = EventRepository(db=db)
        self.event_type_repo = EventTypeRepository(db=db)
        self.executive_repo = ExecutiveRepository()
        self.db = db

    def _validate_payload_references(self, payload: dict):
        executive_id = payload.get("executive_id")
        if executive_id is not None:
            executive = self.executive_repo.get_by_id(self.db, executive_id)
            if not executive:
                raise ValueError("Executivo informado não existe.")

        event_type_id = payload.get("event_type_id")
        if event_type_id:
            event_type = self.event_type_repo.get_by_id(event_type_id)
            if not event_type:
                raise ValueError("Tipo de evento informado não existe.")

        start_time = payload.get("start_time")
        end_time = payload.get("end_time")
        if start_time and end_time and start_time >= end_time:
            raise ValueError("A data/hora de fim deve ser maior que a de início.")

    def get_event(self, event_id: int) -> Optional[models.Event]:
        return self.event_repo.get_by_id(event_id)

    def get_all_events(
        self,
        skip: int = 0,
        limit: int = 1000,
        executive_id: Optional[int] = None,
    ) -> List[models.Event]:
        return self.event_repo.get_all(skip=skip, limit=limit, executive_id=executive_id)

    def create_event(self, payload: schemas.EventCreate) -> models.Event:
        data = payload.model_dump(exclude_unset=True, by_alias=False)
        self._validate_payload_references(data)
        return self.event_repo.create(data)

    def create_many_events(self, payloads: List[schemas.EventCreate]) -> List[models.Event]:
        create_payloads = []
        for payload in payloads:
            data = payload.model_dump(exclude_unset=True, by_alias=False)
            self._validate_payload_references(data)
            create_payloads.append(data)
        return self.event_repo.create_many(create_payloads)

    def update_event(self, event_id: int, payload: schemas.EventUpdate) -> models.Event:
        db_item = self.event_repo.get_by_id(event_id)
        if not db_item:
            raise ValueError("Evento não encontrado.")

        update_data = payload.model_dump(exclude_unset=True, by_alias=False)
        merged = {
            "executive_id": update_data.get("executive_id", db_item.executive_id),
            "event_type_id": update_data.get("event_type_id", db_item.event_type_id),
            "start_time": update_data.get("start_time", db_item.start_time),
            "end_time": update_data.get("end_time", db_item.end_time),
        }
        self._validate_payload_references(merged)
        return self.event_repo.update(db_item, update_data)

    def delete_event(self, event_id: int):
        db_item = self.event_repo.get_by_id(event_id)
        if not db_item:
            raise ValueError("Evento não encontrado.")
        self.event_repo.delete(db_item)
        return {"message": "Evento deletado com sucesso."}

    def delete_by_recurrence(
        self,
        recurrence_id: str,
        from_start_time: Optional[datetime] = None,
    ) -> dict:
        deleted_count = self.event_repo.delete_by_recurrence(
            recurrence_id=recurrence_id,
            from_start_time=from_start_time,
        )
        return {"deletedCount": deleted_count}
