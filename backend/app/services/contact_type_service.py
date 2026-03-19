from typing import List, Optional

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import contact_type_model as models
from app.repositories.contact_type_repository import ContactTypeRepository
from app.schemas import contact_type_schema as schemas


class ContactTypeService:
    def __init__(self, db: Session = Depends(get_db)):
        self.repository = ContactTypeRepository(db=db)

    def get_contact_type(self, contact_type_id: int) -> Optional[models.ContactType]:
        return self.repository.get_by_id(contact_type_id)

    def get_all_contact_types(self, skip: int = 0, limit: int = 1000) -> List[models.ContactType]:
        return self.repository.get_all(skip=skip, limit=limit)

    def create_contact_type(self, payload: schemas.ContactTypeCreate) -> models.ContactType:
        existing = self.repository.get_by_name(payload.name)
        if existing:
            raise ValueError("Já existe um tipo de contato com este nome.")
        return self.repository.create(payload.model_dump())

    def update_contact_type(
        self,
        contact_type_id: int,
        payload: schemas.ContactTypeUpdate,
    ) -> models.ContactType:
        db_item = self.repository.get_by_id(contact_type_id)
        if not db_item:
            raise ValueError("Tipo de contato não encontrado.")

        update_data = payload.model_dump(exclude_unset=True)
        if "name" in update_data and update_data["name"] != db_item.name:
            in_use = self.repository.get_by_name(update_data["name"])
            if in_use and in_use.id != contact_type_id:
                raise ValueError("Já existe um tipo de contato com este nome.")

        return self.repository.update(db_item, update_data)

    def delete_contact_type(self, contact_type_id: int):
        db_item = self.repository.get_by_id(contact_type_id)
        if not db_item:
            raise ValueError("Tipo de contato não encontrado.")
        self.repository.delete(db_item)
        return {"message": "Tipo de contato deletado com sucesso."}
