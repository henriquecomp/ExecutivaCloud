from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class ContactBase(BaseModel):
    full_name: str = Field(..., alias="fullName", min_length=1, max_length=255)
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None
    notes: Optional[str] = None
    contact_type_id: Optional[int] = Field(None, alias="contactTypeId")
    executive_id: int = Field(..., alias="executiveId")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    full_name: Optional[str] = Field(None, alias="fullName", min_length=1, max_length=255)
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None
    notes: Optional[str] = None
    contact_type_id: Optional[int] = Field(None, alias="contactTypeId")
    executive_id: Optional[int] = Field(None, alias="executiveId")

    model_config = ConfigDict(populate_by_name=True)


class Contact(ContactBase):
    id: int
