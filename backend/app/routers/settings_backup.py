from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas import settings_backup_schema as schemas
from app.services.database_restore_service import DatabaseRestoreService
from app.services.settings_backup_service import SettingsBackupService


router = APIRouter(prefix="/settings-backups", tags=["Settings Backups"])


@router.post("/restore", response_model=Dict[str, str])
def restore_database_from_backup(
    payload: schemas.SettingsBackupData,
    service: DatabaseRestoreService = Depends(DatabaseRestoreService),
):
    """Substitui os dados de negócio no SQLite pelo conteúdo do backup (exceto usuários de login e registros de backup)."""
    try:
        service.restore(payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    return {"message": "Dados restaurados no banco de dados."}


@router.get("/", response_model=List[schemas.SettingsBackup])
def get_all_backups(
    skip: int = 0,
    limit: int = 1000,
    service: SettingsBackupService = Depends(SettingsBackupService),
):
    return service.get_all_backups(skip=skip, limit=limit)


@router.get("/{backup_id}", response_model=schemas.SettingsBackup)
def get_backup(
    backup_id: int,
    service: SettingsBackupService = Depends(SettingsBackupService),
):
    db_item = service.get_backup(backup_id)
    if not db_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Backup de configurações não encontrado.")
    return db_item


@router.post("/", response_model=schemas.SettingsBackup, status_code=status.HTTP_201_CREATED)
def create_backup(
    payload: schemas.SettingsBackupCreate,
    service: SettingsBackupService = Depends(SettingsBackupService),
):
    return service.create_backup(payload)


@router.put("/{backup_id}", response_model=schemas.SettingsBackup)
def update_backup(
    backup_id: int,
    payload: schemas.SettingsBackupUpdate,
    service: SettingsBackupService = Depends(SettingsBackupService),
):
    try:
        return service.update_backup(backup_id, payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))


@router.delete("/{backup_id}", response_model=Dict[str, str])
def delete_backup(
    backup_id: int,
    service: SettingsBackupService = Depends(SettingsBackupService),
):
    try:
        return service.delete_backup(backup_id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
