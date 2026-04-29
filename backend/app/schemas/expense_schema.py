from datetime import date
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field, ConfigDict


class ExpenseBase(BaseModel):
    description: str = Field(..., min_length=1, max_length=512)
    amount: Decimal = Field(..., ge=Decimal("0"))
    expense_date: date = Field(..., alias="expenseDate")
    entry_type: Literal["A pagar", "A receber"] = Field(..., alias="type")
    entity_type: Literal["Pessoa Física", "Pessoa Jurídica"] = Field(..., alias="entityType")
    status: Literal["Pendente", "Pago", "Recebida"]
    executive_id: int = Field(..., alias="executiveId")
    expense_category_id: Optional[int] = Field(None, alias="categoryId")
    receipt_url: Optional[str] = Field(None, alias="receiptUrl")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    description: Optional[str] = Field(None, min_length=1, max_length=512)
    amount: Optional[Decimal] = Field(None, ge=Decimal("0"))
    expense_date: Optional[date] = Field(None, alias="expenseDate")
    entry_type: Optional[Literal["A pagar", "A receber"]] = Field(None, alias="type")
    entity_type: Optional[Literal["Pessoa Física", "Pessoa Jurídica"]] = Field(None, alias="entityType")
    status: Optional[Literal["Pendente", "Pago", "Recebida"]] = None
    executive_id: Optional[int] = Field(None, alias="executiveId")
    expense_category_id: Optional[int] = Field(None, alias="categoryId")
    receipt_url: Optional[str] = Field(None, alias="receiptUrl")

    model_config = ConfigDict(populate_by_name=True)


class Expense(ExpenseBase):
    id: int
