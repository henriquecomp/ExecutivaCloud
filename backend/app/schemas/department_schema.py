from pydantic import BaseModel, Field
from typing import Optional

class DepartmentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    organizationId: int

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    organizationId: Optional[int] = None # Permitir mover depto de empresa?

class Department(DepartmentBase):
    id: int

    class Config:
        from_attributes = True