from typing import List, Optional

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import contact_model as models
from app.repositories.contact_repository import ContactRepository
from app.repositories.contact_type_repository import ContactTypeRepository
from app.repositories.executive_repository import ExecutiveRepository
from app.schemas import contact_schema as schemas


class ContactService:
    def __init__(self, db: Session = Depends(get_db)):
        self.repository = ContactRepository(db=db)
        self.contact_type_repository = ContactTypeRepository(db=db)
        self.executive_repository = ExecutiveRepository()
        self.db = db

    def get_contact(self, contact_id: int) -> Optional[models.Contact]:
        return self.repository.get_by_id(contact_id)

    def get_all_contacts(
        self,
        skip: int = 0,
        limit: int = 1000,
        executive_id: Optional[int] = None,
    ) -> List[models.Contact]:
        return self.repository.get_all(skip=skip, limit=limit, executive_id=executive_id)

    def _validate_references(self, payload: dict):
        executive_id = payload.get("executive_id")
        if executive_id is not None and not self.executive_repository.get_by_id(self.db, executive_id):
            raise ValueError("Executivo informado não existe.")

        contact_type_id = payload.get("contact_type_id")
        if contact_type_id is not None and not self.contact_type_repository.get_by_id(contact_type_id):
            raise ValueError("Tipo de contato informado não existe.")

    def create_contact(self, payload: schemas.ContactCreate) -> models.Contact:
        create_data = payload.model_dump(by_alias=False)
        self._validate_references(create_data)
        return self.repository.create(create_data)

    def update_contact(self, contact_id: int, payload: schemas.ContactUpdate) -> models.Contact:
        db_item = self.repository.get_by_id(contact_id)
        if not db_item:
            raise ValueError("Contato não encontrado.")

        update_data = payload.model_dump(by_alias=False, exclude_unset=True)
        if update_data:
            self._validate_references(update_data)
        return self.repository.update(db_item, update_data)

    def delete_contact(self, contact_id: int):
        db_item = self.repository.get_by_id(contact_id)
        if not db_item:
            raise ValueError("Contato não encontrado.")
        self.repository.delete(db_item)
        return {"message": "Contato deletado com sucesso."}
