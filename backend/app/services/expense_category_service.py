from typing import List, Optional

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import expense_category_model as models
from app.repositories.expense_category_repository import ExpenseCategoryRepository
from app.repositories.executive_repository import ExecutiveRepository
from app.schemas import expense_category_schema as schemas


class ExpenseCategoryService:
    def __init__(self, db: Session = Depends(get_db)):
        self.repository = ExpenseCategoryRepository(db=db)
        self.executive_repo = ExecutiveRepository()
        self.db = db

    def _ensure_executive(self, executive_id: int):
        if self.executive_repo.get_by_id(self.db, executive_id) is None:
            raise ValueError("Executivo informado não existe.")

    def get_category(self, category_id: int) -> Optional[models.ExpenseCategory]:
        return self.repository.get_by_id(category_id)

    def get_all_categories(
        self,
        skip: int = 0,
        limit: int = 1000,
        executive_id: Optional[int] = None,
    ) -> List[models.ExpenseCategory]:
        return self.repository.get_all(skip=skip, limit=limit, executive_id=executive_id)

    def create_category(self, payload: schemas.ExpenseCategoryCreate) -> models.ExpenseCategory:
        data = payload.model_dump(exclude_unset=True, by_alias=False)
        self._ensure_executive(data["executive_id"])
        dup = self.repository.get_by_name_for_executive(data["executive_id"], data["name"].strip())
        if dup:
            raise ValueError("Já existe uma categoria com este nome para este executivo.")
        data["name"] = data["name"].strip()
        return self.repository.create(data)

    def update_category(
        self,
        category_id: int,
        payload: schemas.ExpenseCategoryUpdate,
    ) -> models.ExpenseCategory:
        db_item = self.repository.get_by_id(category_id)
        if not db_item:
            raise ValueError("Categoria não encontrada.")

        update_data = payload.model_dump(exclude_unset=True)
        if "name" in update_data and update_data["name"] is not None:
            update_data["name"] = update_data["name"].strip()
            other = self.repository.get_by_name_for_executive(db_item.executive_id, update_data["name"])
            if other and other.id != category_id:
                raise ValueError("Já existe uma categoria com este nome para este executivo.")

        return self.repository.update(db_item, update_data)

    def delete_category(self, category_id: int):
        db_item = self.repository.get_by_id(category_id)
        if not db_item:
            raise ValueError("Categoria não encontrada.")
        self.repository.delete(db_item)
        return {"message": "Categoria excluída com sucesso."}
