from datetime import date
from typing import List, Optional, Union

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import task_model as models
from app.repositories.task_repository import TaskRepository
from app.repositories.executive_repository import ExecutiveRepository
from app.schemas import task_schema as schemas


def _row_dict_with_json_safe_recurrence(
    payload: Union[schemas.TaskCreate, schemas.TaskUpdate],
) -> dict:
    """SQLite JSON não aceita datetime.date aninhados; Date exige objeto date em due_date."""
    data = payload.model_dump(exclude_unset=True, by_alias=False)
    if "recurrence" not in data:
        return data
    if payload.recurrence is None:
        data["recurrence"] = None
    else:
        data["recurrence"] = payload.recurrence.model_dump(
            by_alias=False, mode="json", exclude_none=True
        )
    return data


class TaskService:
    def __init__(self, db: Session = Depends(get_db)):
        self.repository = TaskRepository(db=db)
        self.executive_repo = ExecutiveRepository()
        self.db = db

    def _validate_references(self, payload: dict):
        executive_id = payload.get("executive_id")
        if executive_id is not None:
            executive = self.executive_repo.get_by_id(self.db, executive_id)
            if not executive:
                raise ValueError("Executivo informado não existe.")

    def get_task(self, task_id: int) -> Optional[models.Task]:
        return self.repository.get_by_id(task_id)

    def get_all_tasks(
        self,
        skip: int = 0,
        limit: int = 1000,
        executive_id: Optional[int] = None,
    ) -> List[models.Task]:
        return self.repository.get_all(skip=skip, limit=limit, executive_id=executive_id)

    def create_task(self, payload: schemas.TaskCreate) -> models.Task:
        data = _row_dict_with_json_safe_recurrence(payload)
        self._validate_references(data)
        return self.repository.create(data)

    def create_many_tasks(self, payloads: List[schemas.TaskCreate]) -> List[models.Task]:
        create_payloads = []
        for payload in payloads:
            data = _row_dict_with_json_safe_recurrence(payload)
            self._validate_references(data)
            create_payloads.append(data)
        return self.repository.create_many(create_payloads)

    def update_task(self, task_id: int, payload: schemas.TaskUpdate) -> models.Task:
        db_item = self.repository.get_by_id(task_id)
        if not db_item:
            raise ValueError("Tarefa não encontrada.")

        update_data = _row_dict_with_json_safe_recurrence(payload)
        merged = {
            "executive_id": update_data.get("executive_id", db_item.executive_id),
        }
        self._validate_references(merged)
        return self.repository.update(db_item, update_data)

    def delete_task(self, task_id: int):
        db_item = self.repository.get_by_id(task_id)
        if not db_item:
            raise ValueError("Tarefa não encontrada.")
        self.repository.delete(db_item)
        return {"message": "Tarefa deletada com sucesso."}

    def delete_by_recurrence(
        self,
        recurrence_id: str,
        from_due_date: Optional[date] = None,
    ) -> dict:
        deleted_count = self.repository.delete_by_recurrence(
            recurrence_id=recurrence_id,
            from_due_date=from_due_date,
        )
        return {"deletedCount": deleted_count}
