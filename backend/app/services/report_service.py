from typing import List, Optional

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import report_model as models
from app.repositories.report_repository import ReportRepository
from app.repositories.executive_repository import ExecutiveRepository
from app.schemas import report_schema as schemas


class ReportService:
    def __init__(self, db: Session = Depends(get_db)):
        self.repository = ReportRepository(db=db)
        self.executive_repo = ExecutiveRepository()
        self.db = db

    def _validate_references(self, payload: dict):
        exec_ids = payload.get("selected_executive_ids") or []
        for executive_id in exec_ids:
            executive = self.executive_repo.get_by_id(self.db, executive_id)
            if not executive:
                raise ValueError(f"Executivo informado não existe: {executive_id}")

    def get_report(self, report_id: int) -> Optional[models.Report]:
        return self.repository.get_by_id(report_id)

    def get_all_reports(self, skip: int = 0, limit: int = 1000) -> List[models.Report]:
        return self.repository.get_all(skip=skip, limit=limit)

    def create_report(self, payload: schemas.ReportCreate) -> models.Report:
        data = payload.model_dump(exclude_unset=True, by_alias=False)
        self._validate_references(data)
        return self.repository.create(data)

    def update_report(self, report_id: int, payload: schemas.ReportUpdate) -> models.Report:
        db_item = self.repository.get_by_id(report_id)
        if not db_item:
            raise ValueError("Relatório não encontrado.")

        update_data = payload.model_dump(exclude_unset=True, by_alias=False)
        if "selected_executive_ids" in update_data:
            self._validate_references(update_data)
        return self.repository.update(db_item, update_data)

    def delete_report(self, report_id: int):
        db_item = self.repository.get_by_id(report_id)
        if not db_item:
            raise ValueError("Relatório não encontrado.")
        self.repository.delete(db_item)
        return {"message": "Relatório deletado com sucesso."}
