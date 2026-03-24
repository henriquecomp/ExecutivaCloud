from datetime import date
from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session

from app.models import task_model as models


class TaskRepository:
    def __init__(self, db: Session):
        self.db = db
        self.model = models.Task

    def get_by_id(self, task_id: int) -> Optional[models.Task]:
        return self.db.query(self.model).filter(self.model.id == task_id).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 1000,
        executive_id: Optional[int] = None,
    ) -> List[models.Task]:
        query = self.db.query(self.model)
        if executive_id is not None:
            query = query.filter(self.model.executive_id == executive_id)
        return query.order_by(self.model.due_date.asc()).offset(skip).limit(limit).all()

    def create(self, payload: Dict[str, Any]) -> models.Task:
        db_item = self.model(**payload)
        self.db.add(db_item)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def create_many(self, payloads: List[Dict[str, Any]]) -> List[models.Task]:
        db_items = [self.model(**payload) for payload in payloads]
        self.db.add_all(db_items)
        self.db.commit()
        for item in db_items:
            self.db.refresh(item)
        return db_items

    def update(self, db_item: models.Task, payload: Dict[str, Any]) -> models.Task:
        for key, value in payload.items():
            setattr(db_item, key, value)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def delete(self, db_item: models.Task):
        self.db.delete(db_item)
        self.db.commit()

    def delete_by_recurrence(
        self,
        recurrence_id: str,
        from_due_date: Optional[date] = None,
    ) -> int:
        query = self.db.query(self.model).filter(self.model.recurrence_id == recurrence_id)
        if from_due_date is not None:
            query = query.filter(self.model.due_date >= from_due_date)
        deleted_count = query.delete(synchronize_session=False)
        self.db.commit()
        return deleted_count
