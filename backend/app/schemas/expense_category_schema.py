from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class ExpenseCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    color: str = Field(default="#64748b", max_length=32)
    executive_id: int = Field(..., alias="executiveId")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class ExpenseCategoryCreate(ExpenseCategoryBase):
    pass


class ExpenseCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    color: Optional[str] = Field(None, max_length=32)

    model_config = ConfigDict(populate_by_name=True)


class ExpenseCategory(ExpenseCategoryBase):
    id: int
