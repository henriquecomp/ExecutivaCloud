from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session

from app.models import document_category_model as models


class DocumentCategoryRepository:
    def __init__(self, db: Session):
        self.db = db
        self.model = models.DocumentCategory

    def get_by_id(self, category_id: int) -> Optional[models.DocumentCategory]:
        return self.db.query(self.model).filter(self.model.id == category_id).first()

    def get_by_name(self, name: str) -> Optional[models.DocumentCategory]:
        return self.db.query(self.model).filter(self.model.name == name).first()

    def get_all(self, skip: int = 0, limit: int = 1000) -> List[models.DocumentCategory]:
        return self.db.query(self.model).order_by(self.model.name.asc()).offset(skip).limit(limit).all()

    def create(self, payload: Dict[str, Any]) -> models.DocumentCategory:
        db_item = self.model(**payload)
        self.db.add(db_item)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def update(
        self,
        db_item: models.DocumentCategory,
        payload: Dict[str, Any],
    ) -> models.DocumentCategory:
        for key, value in payload.items():
            setattr(db_item, key, value)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def delete(self, db_item: models.DocumentCategory):
        self.db.delete(db_item)
        self.db.commit()
