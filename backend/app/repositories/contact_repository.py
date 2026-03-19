from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session

from app.models import contact_model as models


class ContactRepository:
    def __init__(self, db: Session):
        self.db = db
        self.model = models.Contact

    def get_by_id(self, contact_id: int) -> Optional[models.Contact]:
        return self.db.query(self.model).filter(self.model.id == contact_id).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 1000,
        executive_id: Optional[int] = None,
    ) -> List[models.Contact]:
        query = self.db.query(self.model)
        if executive_id is not None:
            query = query.filter(self.model.executive_id == executive_id)
        return query.order_by(self.model.full_name.asc()).offset(skip).limit(limit).all()

    def create(self, payload: Dict[str, Any]) -> models.Contact:
        db_item = self.model(**payload)
        self.db.add(db_item)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def update(self, db_item: models.Contact, payload: Dict[str, Any]) -> models.Contact:
        for key, value in payload.items():
            setattr(db_item, key, value)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def delete(self, db_item: models.Contact):
        self.db.delete(db_item)
        self.db.commit()
