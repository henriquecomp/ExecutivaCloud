from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, ConfigDict


class ReportBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    selected_executive_ids: List[int] = Field(default_factory=list, alias="selectedExecutiveIds")
    start_date: Optional[date] = Field(None, alias="startDate")
    end_date: Optional[date] = Field(None, alias="endDate")
    include_events: bool = Field(default=True, alias="includeEvents")
    include_expenses: bool = Field(default=True, alias="includeExpenses")
    include_tasks: bool = Field(default=True, alias="includeTasks")
    include_contacts: bool = Field(default=True, alias="includeContacts")
    total_records: int = Field(default=0, alias="totalRecords", ge=0)
    generated_data: List[Dict[str, Any]] = Field(default_factory=list, alias="generatedData")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class ReportCreate(ReportBase):
    pass


class ReportUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    selected_executive_ids: Optional[List[int]] = Field(None, alias="selectedExecutiveIds")
    start_date: Optional[date] = Field(None, alias="startDate")
    end_date: Optional[date] = Field(None, alias="endDate")
    include_events: Optional[bool] = Field(None, alias="includeEvents")
    include_expenses: Optional[bool] = Field(None, alias="includeExpenses")
    include_tasks: Optional[bool] = Field(None, alias="includeTasks")
    include_contacts: Optional[bool] = Field(None, alias="includeContacts")
    total_records: Optional[int] = Field(None, alias="totalRecords", ge=0)
    generated_data: Optional[List[Dict[str, Any]]] = Field(None, alias="generatedData")

    model_config = ConfigDict(populate_by_name=True)


class Report(ReportBase):
    id: int
    generated_at: datetime = Field(..., alias="generatedAt")
