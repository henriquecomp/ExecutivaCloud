from pydantic import BaseModel, Field
from typing import Optional


class DocumentCategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)


class DocumentCategoryCreate(DocumentCategoryBase):
    pass


class DocumentCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)


class DocumentCategory(DocumentCategoryBase):
    id: int

    class Config:
        from_attributes = True
