from pydantic import BaseModel, Field
from typing import Optional

class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    legalOrganizationId: int # Obrigatório na criação
    cnpj: Optional[str] = None
    street: Optional[str] = None
    number: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipCode: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    legalOrganizationId: Optional[int] = None
    cnpj: Optional[str] = None
    street: Optional[str] = None
    number: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipCode: Optional[str] = None

class Organization(OrganizationBase):
    id: int

    class Config:
        from_attributes = True