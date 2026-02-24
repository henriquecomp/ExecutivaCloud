from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.secretary_repository import SecretaryRepository
from app.schemas.secretary_schema import SecretaryCreate, SecretaryUpdate

class SecretaryService:
    def __init__(self):
        self.repository = SecretaryRepository()

    def list_secretaries(self, db: Session, skip: int = 0, limit: int = 1000):
        return self.repository.get_all(db, skip, limit)

    def get_secretary(self, db: Session, secretary_id: int):
        secretary = self.repository.get_by_id(db, secretary_id)
        if not secretary:
            raise HTTPException(status_code=404, detail="Secretária não encontrada")
        return secretary

    def create_secretary(self, db: Session, secretary_data: SecretaryCreate):
        if secretary_data.cpf:
            existing = self.repository.get_by_cpf(db, secretary_data.cpf)
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CPF já cadastrado.")
        return self.repository.create(db, secretary_data)

    def update_secretary(self, db: Session, secretary_id: int, secretary_data: SecretaryUpdate):
        db_secretary = self.get_secretary(db, secretary_id)
        
        if secretary_data.cpf and secretary_data.cpf != db_secretary.cpf:
            existing = self.repository.get_by_cpf(db, secretary_data.cpf)
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Novo CPF já está em uso.")
                
        update_data = secretary_data.model_dump(exclude_unset=True, by_alias=False)
        return self.repository.update(db, db_secretary, update_data)

    def delete_secretary(self, db: Session, secretary_id: int):
        db_secretary = self.get_secretary(db, secretary_id)
        self.repository.delete(db, db_secretary)
        return {"detail": "Secretária removida com sucesso"}