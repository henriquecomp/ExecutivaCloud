from typing import List, Optional

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import settings_backup_model as models
from app.repositories.settings_backup_repository import SettingsBackupRepository
from app.schemas import settings_backup_schema as schemas


class SettingsBackupService:
    def __init__(self, db: Session = Depends(get_db)):
        self.repository = SettingsBackupRepository(db=db)

    def get_backup(self, backup_id: int) -> Optional[models.SettingsBackup]:
        return self.repository.get_by_id(backup_id)

    def get_all_backups(self, skip: int = 0, limit: int = 1000) -> List[models.SettingsBackup]:
        return self.repository.get_all(skip=skip, limit=limit)

    def create_backup(self, payload: schemas.SettingsBackupCreate) -> models.SettingsBackup:
        data = payload.model_dump(exclude_unset=True, by_alias=False)
        return self.repository.create(data)

    def update_backup(
        self,
        backup_id: int,
        payload: schemas.SettingsBackupUpdate,
    ) -> models.SettingsBackup:
        db_item = self.repository.get_by_id(backup_id)
        if not db_item:
            raise ValueError("Backup de configurações não encontrado.")
        update_data = payload.model_dump(exclude_unset=True, by_alias=False)
        return self.repository.update(db_item, update_data)

    def delete_backup(self, backup_id: int):
        db_item = self.repository.get_by_id(backup_id)
        if not db_item:
            raise ValueError("Backup de configurações não encontrado.")
        self.repository.delete(db_item)
        return {"message": "Backup deletado com sucesso."}
