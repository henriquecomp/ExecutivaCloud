from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session

from app.models import report_model as models


class ReportRepository:
    def __init__(self, db: Session):
        self.db = db
        self.model = models.Report

    def get_by_id(self, report_id: int) -> Optional[models.Report]:
        return self.db.query(self.model).filter(self.model.id == report_id).first()

    def get_all(self, skip: int = 0, limit: int = 1000) -> List[models.Report]:
        return self.db.query(self.model).order_by(self.model.generated_at.desc()).offset(skip).limit(limit).all()

    def create(self, payload: Dict[str, Any]) -> models.Report:
        db_item = self.model(**payload)
        self.db.add(db_item)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def update(self, db_item: models.Report, payload: Dict[str, Any]) -> models.Report:
        for key, value in payload.items():
            setattr(db_item, key, value)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def delete(self, db_item: models.Report):
        self.db.delete(db_item)
        self.db.commit()
