from typing import Optional

from pydantic import BaseModel, Field


class ContactTypeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    color: str = Field(default="#64748b", min_length=4, max_length=7)


class ContactTypeCreate(ContactTypeBase):
    pass


class ContactTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    color: Optional[str] = Field(None, min_length=4, max_length=7)


class ContactType(ContactTypeBase):
    id: int

    class Config:
        from_attributes = True
