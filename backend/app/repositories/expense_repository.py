from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models import expense_model as models


class ExpenseRepository:
    def __init__(self, db: Session):
        self.db = db
        self.model = models.Expense

    def get_by_id(self, expense_id: int) -> Optional[models.Expense]:
        return self.db.query(self.model).filter(self.model.id == expense_id).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 1000,
        executive_id: Optional[int] = None,
    ) -> List[models.Expense]:
        query = self.db.query(self.model)
        if executive_id is not None:
            query = query.filter(self.model.executive_id == executive_id)
        return query.order_by(self.model.expense_date.desc()).offset(skip).limit(limit).all()

    def create(self, payload: Dict[str, Any]) -> models.Expense:
        db_item = self.model(**payload)
        self.db.add(db_item)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def update(self, db_item: models.Expense, payload: Dict[str, Any]) -> models.Expense:
        for key, value in payload.items():
            setattr(db_item, key, value)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def delete(self, db_item: models.Expense):
        self.db.delete(db_item)
        self.db.commit()
