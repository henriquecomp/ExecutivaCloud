from typing import List, Optional

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import document_model as models
from app.repositories.document_repository import DocumentRepository
from app.repositories.document_category_repository import DocumentCategoryRepository
from app.repositories.executive_repository import ExecutiveRepository
from app.schemas import document_schema as schemas


class DocumentService:
    def __init__(self, db: Session = Depends(get_db)):
        self.repository = DocumentRepository(db=db)
        self.category_repo = DocumentCategoryRepository(db=db)
        self.executive_repo = ExecutiveRepository()
        self.db = db

    def _validate_references(self, payload: dict):
        executive_id = payload.get("executive_id")
        if executive_id is not None:
            executive = self.executive_repo.get_by_id(self.db, executive_id)
            if not executive:
                raise ValueError("Executivo informado não existe.")

        category_id = payload.get("category_id")
        if category_id is not None:
            category = self.category_repo.get_by_id(category_id)
            if not category:
                raise ValueError("Categoria informada não existe.")

    def get_document(self, document_id: int) -> Optional[models.Document]:
        return self.repository.get_by_id(document_id)

    def get_all_documents(
        self,
        skip: int = 0,
        limit: int = 1000,
        executive_id: Optional[int] = None,
    ) -> List[models.Document]:
        return self.repository.get_all(skip=skip, limit=limit, executive_id=executive_id)

    def create_document(self, payload: schemas.DocumentCreate) -> models.Document:
        data = payload.model_dump(exclude_unset=True, by_alias=False)
        self._validate_references(data)
        return self.repository.create(data)

    def update_document(self, document_id: int, payload: schemas.DocumentUpdate) -> models.Document:
        db_item = self.repository.get_by_id(document_id)
        if not db_item:
            raise ValueError("Documento não encontrado.")

        update_data = payload.model_dump(exclude_unset=True, by_alias=False)
        merged = {
            "executive_id": update_data.get("executive_id", db_item.executive_id),
            "category_id": update_data.get("category_id", db_item.category_id),
        }
        self._validate_references(merged)
        return self.repository.update(db_item, update_data)

    def delete_document(self, document_id: int):
        db_item = self.repository.get_by_id(document_id)
        if not db_item:
            raise ValueError("Documento não encontrado.")
        self.repository.delete(db_item)
        return {"message": "Documento deletado com sucesso."}
