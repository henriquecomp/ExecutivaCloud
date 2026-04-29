from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models import expense_category_model as models


class ExpenseCategoryRepository:
    def __init__(self, db: Session):
        self.db = db
        self.model = models.ExpenseCategory

    def get_by_id(self, category_id: int) -> Optional[models.ExpenseCategory]:
        return self.db.query(self.model).filter(self.model.id == category_id).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 1000,
        executive_id: Optional[int] = None,
    ) -> List[models.ExpenseCategory]:
        query = self.db.query(self.model)
        if executive_id is not None:
            query = query.filter(self.model.executive_id == executive_id)
        return query.order_by(self.model.name.asc()).offset(skip).limit(limit).all()

    def get_by_name_for_executive(self, executive_id: int, name: str) -> Optional[models.ExpenseCategory]:
        return (
            self.db.query(self.model)
            .filter(self.model.executive_id == executive_id, self.model.name == name)
            .first()
        )

    def create(self, payload: Dict[str, Any]) -> models.ExpenseCategory:
        db_item = self.model(**payload)
        self.db.add(db_item)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def update(self, db_item: models.ExpenseCategory, payload: Dict[str, Any]) -> models.ExpenseCategory:
        for key, value in payload.items():
            setattr(db_item, key, value)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def delete(self, db_item: models.ExpenseCategory):
        self.db.delete(db_item)
        self.db.commit()
