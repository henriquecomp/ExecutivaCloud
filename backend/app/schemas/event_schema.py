from datetime import datetime, date
from typing import Optional, Literal, List

from pydantic import BaseModel, Field, ConfigDict


class RecurrenceRule(BaseModel):
    frequency: Literal["daily", "weekly", "monthly", "annually"]
    interval: int = Field(default=1, ge=1)
    days_of_week: Optional[List[int]] = Field(default=None, alias="daysOfWeek")
    end_date: Optional[date] = Field(default=None, alias="endDate")
    count: Optional[int] = Field(default=None, ge=1)

    model_config = ConfigDict(populate_by_name=True)


class EventBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    start_time: datetime = Field(..., alias="startTime")
    end_time: datetime = Field(..., alias="endTime")
    location: Optional[str] = None
    event_type_id: Optional[int] = Field(None, alias="eventTypeId")
    executive_id: int = Field(..., alias="executiveId")
    reminder_minutes: Optional[int] = Field(None, alias="reminderMinutes")
    recurrence_id: Optional[str] = Field(None, alias="recurrenceId")
    recurrence: Optional[RecurrenceRule] = None

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    start_time: Optional[datetime] = Field(None, alias="startTime")
    end_time: Optional[datetime] = Field(None, alias="endTime")
    location: Optional[str] = None
    event_type_id: Optional[int] = Field(None, alias="eventTypeId")
    executive_id: Optional[int] = Field(None, alias="executiveId")
    reminder_minutes: Optional[int] = Field(None, alias="reminderMinutes")
    recurrence_id: Optional[str] = Field(None, alias="recurrenceId")
    recurrence: Optional[RecurrenceRule] = None

    model_config = ConfigDict(populate_by_name=True)


class Event(EventBase):
    id: int


class RecurrenceDeleteResult(BaseModel):
    deleted_count: int = Field(..., alias="deletedCount")

    model_config = ConfigDict(populate_by_name=True)
