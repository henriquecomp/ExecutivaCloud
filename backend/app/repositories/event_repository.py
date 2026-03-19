from datetime import datetime
from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session

from app.models import event_model as models


class EventRepository:
    def __init__(self, db: Session):
        self.db = db
        self.model = models.Event

    def get_by_id(self, event_id: int) -> Optional[models.Event]:
        return self.db.query(self.model).filter(self.model.id == event_id).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 1000,
        executive_id: Optional[int] = None,
    ) -> List[models.Event]:
        query = self.db.query(self.model)
        if executive_id is not None:
            query = query.filter(self.model.executive_id == executive_id)
        return query.order_by(self.model.start_time.asc()).offset(skip).limit(limit).all()

    def create(self, payload: Dict[str, Any]) -> models.Event:
        db_item = self.model(**payload)
        self.db.add(db_item)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def create_many(self, payloads: List[Dict[str, Any]]) -> List[models.Event]:
        db_items = [self.model(**payload) for payload in payloads]
        self.db.add_all(db_items)
        self.db.commit()
        for item in db_items:
            self.db.refresh(item)
        return db_items

    def update(self, db_item: models.Event, payload: Dict[str, Any]) -> models.Event:
        for key, value in payload.items():
            setattr(db_item, key, value)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def delete(self, db_item: models.Event):
        self.db.delete(db_item)
        self.db.commit()

    def delete_by_recurrence(
        self,
        recurrence_id: str,
        from_start_time: Optional[datetime] = None,
    ) -> int:
        query = self.db.query(self.model).filter(self.model.recurrence_id == recurrence_id)
        if from_start_time is not None:
            query = query.filter(self.model.start_time >= from_start_time)
        deleted_count = query.delete(synchronize_session=False)
        self.db.commit()
        return deleted_count
