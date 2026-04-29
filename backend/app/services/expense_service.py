from decimal import Decimal
from typing import List, Optional

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import expense_model as models
from app.repositories.expense_category_repository import ExpenseCategoryRepository
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.executive_repository import ExecutiveRepository
from app.schemas import expense_schema as schemas


class ExpenseService:
    def __init__(self, db: Session = Depends(get_db)):
        self.repository = ExpenseRepository(db=db)
        self.executive_repo = ExecutiveRepository()
        self.category_repo = ExpenseCategoryRepository(db=db)
        self.db = db

    def _validate_refs(self, executive_id: int, category_id: Optional[int]):
        if self.executive_repo.get_by_id(self.db, executive_id) is None:
            raise ValueError("Executivo informado não existe.")
        if category_id is not None:
            cat = self.category_repo.get_by_id(category_id)
            if not cat:
                raise ValueError("Categoria informada não existe.")
            if cat.executive_id != executive_id:
                raise ValueError("A categoria não pertence ao executivo do lançamento.")

    def get_expense(self, expense_id: int) -> Optional[models.Expense]:
        return self.repository.get_by_id(expense_id)

    def get_all_expenses(
        self,
        skip: int = 0,
        limit: int = 1000,
        executive_id: Optional[int] = None,
    ) -> List[models.Expense]:
        return self.repository.get_all(skip=skip, limit=limit, executive_id=executive_id)

    def create_expense(self, payload: schemas.ExpenseCreate) -> models.Expense:
        data = payload.model_dump(exclude_unset=True, by_alias=False)
        self._validate_refs(data["executive_id"], data.get("expense_category_id"))
        if isinstance(data.get("amount"), float):
            data["amount"] = Decimal(str(data["amount"]))
        return self.repository.create(data)

    def update_expense(self, expense_id: int, payload: schemas.ExpenseUpdate) -> models.Expense:
        db_item = self.repository.get_by_id(expense_id)
        if not db_item:
            raise ValueError("Lançamento não encontrado.")

        update_data = payload.model_dump(exclude_unset=True, by_alias=False)
        merged_exec = update_data.get("executive_id", db_item.executive_id)
        merged_cat = update_data.get("expense_category_id", db_item.expense_category_id)
        self._validate_refs(int(merged_exec), merged_cat)

        if isinstance(update_data.get("amount"), float):
            update_data["amount"] = Decimal(str(update_data["amount"]))

        return self.repository.update(db_item, update_data)

    def delete_expense(self, expense_id: int):
        db_item = self.repository.get_by_id(expense_id)
        if not db_item:
            raise ValueError("Lançamento não encontrado.")
        self.repository.delete(db_item)
        return {"message": "Lançamento excluído com sucesso."}
