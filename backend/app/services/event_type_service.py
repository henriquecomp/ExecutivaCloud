from typing import List, Optional

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import event_type_model as models
from app.repositories.event_type_repository import EventTypeRepository
from app.schemas import event_type_schema as schemas


class EventTypeService:
    def __init__(self, db: Session = Depends(get_db)):
        self.repository = EventTypeRepository(db=db)

    def get_event_type(self, event_type_id: int) -> Optional[models.EventType]:
        return self.repository.get_by_id(event_type_id)

    def get_all_event_types(self, skip: int = 0, limit: int = 1000) -> List[models.EventType]:
        return self.repository.get_all(skip=skip, limit=limit)

    def create_event_type(self, payload: schemas.EventTypeCreate) -> models.EventType:
        existing = self.repository.get_by_name(payload.name)
        if existing:
            raise ValueError("Já existe um tipo de evento com este nome.")
        return self.repository.create(payload.model_dump())

    def update_event_type(
        self,
        event_type_id: int,
        payload: schemas.EventTypeUpdate,
    ) -> models.EventType:
        db_item = self.repository.get_by_id(event_type_id)
        if not db_item:
            raise ValueError("Tipo de evento não encontrado.")

        update_data = payload.model_dump(exclude_unset=True)
        if "name" in update_data and update_data["name"] != db_item.name:
            name_in_use = self.repository.get_by_name(update_data["name"])
            if name_in_use and name_in_use.id != event_type_id:
                raise ValueError("Já existe um tipo de evento com este nome.")

        return self.repository.update(db_item, update_data)

    def delete_event_type(self, event_type_id: int):
        db_item = self.repository.get_by_id(event_type_id)
        if not db_item:
            raise ValueError("Tipo de evento não encontrado.")
        self.repository.delete(db_item)
        return {"message": "Tipo de evento deletado com sucesso."}
