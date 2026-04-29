from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas import expense_category_schema as schemas
from app.services.expense_category_service import ExpenseCategoryService

router = APIRouter(prefix="/expense-categories", tags=["Expense categories"])


@router.get("/", response_model=List[schemas.ExpenseCategory])
def list_categories(
    skip: int = 0,
    limit: int = 1000,
    executive_id: Optional[int] = None,
    service: ExpenseCategoryService = Depends(ExpenseCategoryService),
):
    return service.get_all_categories(skip=skip, limit=limit, executive_id=executive_id)


@router.post("/", response_model=schemas.ExpenseCategory, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: schemas.ExpenseCategoryCreate,
    service: ExpenseCategoryService = Depends(ExpenseCategoryService),
):
    try:
        return service.create_category(payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{category_id}", response_model=schemas.ExpenseCategory)
def update_category(
    category_id: int,
    payload: schemas.ExpenseCategoryUpdate,
    service: ExpenseCategoryService = Depends(ExpenseCategoryService),
):
    try:
        return service.update_category(category_id, payload)
    except ValueError as e:
        detail = str(e)
        code = status.HTTP_404_NOT_FOUND if "não encontrada" in detail else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=code, detail=detail)


@router.delete("/{category_id}", response_model=Dict[str, str])
def delete_category(
    category_id: int,
    service: ExpenseCategoryService = Depends(ExpenseCategoryService),
):
    try:
        return service.delete_category(category_id)
    except ValueError as e:
        detail = str(e)
        code = status.HTTP_404_NOT_FOUND if "não encontrada" in detail else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=code, detail=detail)
