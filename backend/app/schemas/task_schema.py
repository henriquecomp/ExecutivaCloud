from datetime import date
from typing import Optional, Literal, List

from pydantic import BaseModel, Field, ConfigDict


class RecurrenceRule(BaseModel):
    frequency: Literal["daily", "weekly", "monthly", "annually"]
    interval: int = Field(default=1, ge=1)
    days_of_week: Optional[List[int]] = Field(default=None, alias="daysOfWeek")
    end_date: Optional[date] = Field(default=None, alias="endDate")
    count: Optional[int] = Field(default=None, ge=1)

    model_config = ConfigDict(populate_by_name=True)


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    due_date: date = Field(..., alias="dueDate")
    priority: Literal["Alta", "Média", "Baixa"]
    status: Literal["A Fazer", "Em Andamento", "Concluído"]
    executive_id: int = Field(..., alias="executiveId")
    recurrence_id: Optional[str] = Field(None, alias="recurrenceId")
    recurrence: Optional[RecurrenceRule] = None

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    due_date: Optional[date] = Field(None, alias="dueDate")
    priority: Optional[Literal["Alta", "Média", "Baixa"]] = None
    status: Optional[Literal["A Fazer", "Em Andamento", "Concluído"]] = None
    executive_id: Optional[int] = Field(None, alias="executiveId")
    recurrence_id: Optional[str] = Field(None, alias="recurrenceId")
    recurrence: Optional[RecurrenceRule] = None

    model_config = ConfigDict(populate_by_name=True)


class Task(TaskBase):
    id: int


class RecurrenceDeleteResult(BaseModel):
    deleted_count: int = Field(..., alias="deletedCount")

    model_config = ConfigDict(populate_by_name=True)
