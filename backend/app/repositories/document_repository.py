from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session

from app.models import document_model as models


class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db
        self.model = models.Document

    def get_by_id(self, document_id: int) -> Optional[models.Document]:
        return self.db.query(self.model).filter(self.model.id == document_id).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 1000,
        executive_id: Optional[int] = None,
    ) -> List[models.Document]:
        query = self.db.query(self.model)
        if executive_id is not None:
            query = query.filter(self.model.executive_id == executive_id)
        return query.order_by(self.model.upload_date.desc()).offset(skip).limit(limit).all()

    def create(self, payload: Dict[str, Any]) -> models.Document:
        db_item = self.model(**payload)
        self.db.add(db_item)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def update(self, db_item: models.Document, payload: Dict[str, Any]) -> models.Document:
        for key, value in payload.items():
            setattr(db_item, key, value)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def delete(self, db_item: models.Document):
        self.db.delete(db_item)
        self.db.commit()
