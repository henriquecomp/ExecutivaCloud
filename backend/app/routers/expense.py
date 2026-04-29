from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas import expense_schema as schemas
from app.services.expense_service import ExpenseService

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.get("/", response_model=List[schemas.Expense])
def list_expenses(
    skip: int = 0,
    limit: int = 1000,
    executive_id: Optional[int] = None,
    service: ExpenseService = Depends(ExpenseService),
):
    return service.get_all_expenses(skip=skip, limit=limit, executive_id=executive_id)


@router.get("/{expense_id}", response_model=schemas.Expense)
def get_expense(
    expense_id: int,
    service: ExpenseService = Depends(ExpenseService),
):
    row = service.get_expense(expense_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lançamento não encontrado.")
    return row


@router.post("/", response_model=schemas.Expense, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: schemas.ExpenseCreate,
    service: ExpenseService = Depends(ExpenseService),
):
    try:
        return service.create_expense(payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{expense_id}", response_model=schemas.Expense)
def update_expense(
    expense_id: int,
    payload: schemas.ExpenseUpdate,
    service: ExpenseService = Depends(ExpenseService),
):
    try:
        return service.update_expense(expense_id, payload)
    except ValueError as e:
        detail = str(e)
        code = status.HTTP_404_NOT_FOUND if "não encontrado" in detail else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=code, detail=detail)


@router.delete("/{expense_id}", response_model=Dict[str, str])
def delete_expense(
    expense_id: int,
    service: ExpenseService = Depends(ExpenseService),
):
    try:
        return service.delete_expense(expense_id)
    except ValueError as e:
        detail = str(e)
        code = status.HTTP_404_NOT_FOUND if "não encontrado" in detail else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=code, detail=detail)
