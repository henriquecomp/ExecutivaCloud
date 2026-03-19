from typing import List, Optional

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import document_category_model as models
from app.repositories.document_category_repository import DocumentCategoryRepository
from app.schemas import document_category_schema as schemas


class DocumentCategoryService:
    def __init__(self, db: Session = Depends(get_db)):
        self.repository = DocumentCategoryRepository(db=db)

    def get_category(self, category_id: int) -> Optional[models.DocumentCategory]:
        return self.repository.get_by_id(category_id)

    def get_all_categories(self, skip: int = 0, limit: int = 1000) -> List[models.DocumentCategory]:
        return self.repository.get_all(skip=skip, limit=limit)

    def create_category(self, payload: schemas.DocumentCategoryCreate) -> models.DocumentCategory:
        existing = self.repository.get_by_name(payload.name)
        if existing:
            raise ValueError("Já existe uma categoria com este nome.")
        return self.repository.create(payload.model_dump())

    def update_category(
        self,
        category_id: int,
        payload: schemas.DocumentCategoryUpdate,
    ) -> models.DocumentCategory:
        db_item = self.repository.get_by_id(category_id)
        if not db_item:
            raise ValueError("Categoria não encontrada.")

        update_data = payload.model_dump(exclude_unset=True)
        if "name" in update_data and update_data["name"] != db_item.name:
            name_in_use = self.repository.get_by_name(update_data["name"])
            if name_in_use and name_in_use.id != category_id:
                raise ValueError("Já existe uma categoria com este nome.")

        return self.repository.update(db_item, update_data)

    def delete_category(self, category_id: int):
        db_item = self.repository.get_by_id(category_id)
        if not db_item:
            raise ValueError("Categoria não encontrada.")
        self.repository.delete(db_item)
        return {"message": "Categoria deletada com sucesso."}
