from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class DocumentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    image_url: str = Field(..., alias="imageUrl")
    category_id: Optional[int] = Field(None, alias="categoryId")
    executive_id: int = Field(..., alias="executiveId")
    upload_date: datetime = Field(..., alias="uploadDate")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    image_url: Optional[str] = Field(None, alias="imageUrl")
    category_id: Optional[int] = Field(None, alias="categoryId")
    executive_id: Optional[int] = Field(None, alias="executiveId")
    upload_date: Optional[datetime] = Field(None, alias="uploadDate")

    model_config = ConfigDict(populate_by_name=True)


class Document(DocumentBase):
    id: int
