from pydantic import BaseModel, Field
from typing import Optional

# Campos base (compartilhados)
class LegalOrganizationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    cnpj: Optional[str] = None
    street: Optional[str] = None
    number: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipCode: Optional[str] = None # Mantém o camelCase de types.ts

# Schema para criação (input)
class LegalOrganizationCreate(LegalOrganizationBase):
    pass

# Schema para atualização (input, tudo opcional)
class LegalOrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    cnpj: Optional[str] = None
    street: Optional[str] = None
    number: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipCode: Optional[str] = None

# Schema para resposta (output)
class LegalOrganization(LegalOrganizationBase):
    id: int

    class Config:
        from_attributes = True