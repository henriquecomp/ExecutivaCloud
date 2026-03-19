from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session

from app.models import event_type_model as models


class EventTypeRepository:
    def __init__(self, db: Session):
        self.db = db
        self.model = models.EventType

    def get_by_id(self, event_type_id: int) -> Optional[models.EventType]:
        return self.db.query(self.model).filter(self.model.id == event_type_id).first()

    def get_by_name(self, name: str) -> Optional[models.EventType]:
        return self.db.query(self.model).filter(self.model.name == name).first()

    def get_all(self, skip: int = 0, limit: int = 1000) -> List[models.EventType]:
        return self.db.query(self.model).offset(skip).limit(limit).all()

    def create(self, payload: Dict[str, Any]) -> models.EventType:
        db_item = self.model(**payload)
        self.db.add(db_item)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def update(self, db_item: models.EventType, payload: Dict[str, Any]) -> models.EventType:
        for key, value in payload.items():
            setattr(db_item, key, value)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def delete(self, db_item: models.EventType):
        self.db.delete(db_item)
        self.db.commit()
