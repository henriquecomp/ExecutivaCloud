from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session

from app.models import contact_type_model as models


class ContactTypeRepository:
    def __init__(self, db: Session):
        self.db = db
        self.model = models.ContactType

    def get_by_id(self, contact_type_id: int) -> Optional[models.ContactType]:
        return self.db.query(self.model).filter(self.model.id == contact_type_id).first()

    def get_by_name(self, name: str) -> Optional[models.ContactType]:
        return self.db.query(self.model).filter(self.model.name == name).first()

    def get_all(self, skip: int = 0, limit: int = 1000) -> List[models.ContactType]:
        return self.db.query(self.model).order_by(self.model.name.asc()).offset(skip).limit(limit).all()

    def create(self, payload: Dict[str, Any]) -> models.ContactType:
        db_item = self.model(**payload)
        self.db.add(db_item)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def update(self, db_item: models.ContactType, payload: Dict[str, Any]) -> models.ContactType:
        for key, value in payload.items():
            setattr(db_item, key, value)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def delete(self, db_item: models.ContactType):
        self.db.delete(db_item)
        self.db.commit()
