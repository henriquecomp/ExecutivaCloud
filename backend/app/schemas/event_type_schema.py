from pydantic import BaseModel, Field
from typing import Optional


class EventTypeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    color: str = Field(default="#3b82f6", min_length=4, max_length=7)


class EventTypeCreate(EventTypeBase):
    pass


class EventTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    color: Optional[str] = Field(None, min_length=4, max_length=7)


class EventType(EventTypeBase):
    id: int

    class Config:
        from_attributes = True
