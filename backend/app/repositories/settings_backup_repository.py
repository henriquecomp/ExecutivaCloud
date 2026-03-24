from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session

from app.models import settings_backup_model as models


class SettingsBackupRepository:
    def __init__(self, db: Session):
        self.db = db
        self.model = models.SettingsBackup

    def get_by_id(self, backup_id: int) -> Optional[models.SettingsBackup]:
        return self.db.query(self.model).filter(self.model.id == backup_id).first()

    def get_all(self, skip: int = 0, limit: int = 1000) -> List[models.SettingsBackup]:
        return self.db.query(self.model).order_by(self.model.created_at.desc()).offset(skip).limit(limit).all()

    def create(self, payload: Dict[str, Any]) -> models.SettingsBackup:
        db_item = self.model(**payload)
        self.db.add(db_item)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def update(self, db_item: models.SettingsBackup, payload: Dict[str, Any]) -> models.SettingsBackup:
        for key, value in payload.items():
            setattr(db_item, key, value)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def delete(self, db_item: models.SettingsBackup):
        self.db.delete(db_item)
        self.db.commit()
