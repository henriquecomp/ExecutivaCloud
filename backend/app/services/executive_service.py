from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.executive_repository import ExecutiveRepository
from app.schemas.executive_schema import ExecutiveCreate, ExecutiveUpdate


class ExecutiveService:
    def __init__(self):
        self.repository = ExecutiveRepository()

    def list_executives(self, db: Session, skip: int = 0, limit: int = 100):
        return self.repository.get_all(db, skip, limit)

    def create_executive(self, db: Session, executive_data: ExecutiveCreate):
        existing = self.repository.get_by_email(db, executive_data.work_email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email de trabalho já cadastrado.",
            )
        return self.repository.create(db, executive_data)

    def get_executive(self, db: Session, executive_id: int):
        executive = self.repository.get_by_id(db, executive_id)
        if not executive:
            raise HTTPException(status_code=404, detail="Executivo não encontrado")
        return executive

    def update_executive(
        self, db: Session, executive_id: int, executive_data: ExecutiveUpdate
    ):
        db_executive = self.get_executive(db, executive_id)
        update_data = executive_data.model_dump(exclude_unset=True, by_alias=False)
        return self.repository.update(db, db_executive, update_data)

    def delete_executive(self, db: Session, executive_id: int):
        db_executive = self.get_executive(db, executive_id)
        self.repository.delete(db, db_executive)
        return {"detail": "Executivo removido com sucesso"}
