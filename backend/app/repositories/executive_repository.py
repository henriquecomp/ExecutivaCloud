from sqlalchemy.orm import Session
from app.models import executive_model as models
from typing import List, Optional, Dict, Any


class ExecutiveRepository:
    def __init__(self, db: Session):
        self.db = db
        self.model = models.Executive

    def get_by_id(self, exec_id: int) -> Optional[models.Executive]:
        return self.db.query(self.model).filter(self.model.id == exec_id).first()

    def get_by_email(self, email: str) -> Optional[models.Executive]:
        # Verifica tanto email pessoal quanto profissional
        return (
            self.db.query(self.model)
            .filter(
                (self.model.work_email == email) | (self.model.personal_email == email)
            )
            .first()
        )

    def get_by_cpf(self, cpf: str) -> Optional[models.Executive]:
        return self.db.query(self.model).filter(self.model.cpf == cpf).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[models.Executive]:
        return self.db.query(self.model).offset(skip).limit(limit).all()

    def create(self, exec_data: Dict[str, Any]) -> models.Executive:
        # Pydantic (dict) -> SQLAlchemy Model
        # As chaves já devem estar compatíveis ou mapeadas antes de chegar aqui.
        db_exec = self.model(**exec_data)
        self.db.add(db_exec)
        self.db.commit()
        self.db.refresh(db_exec)
        return db_exec

    def update(
        self, db_exec: models.Executive, update_data: Dict[str, Any]
    ) -> models.Executive:
        for key, value in update_data.items():
            setattr(db_exec, key, value)
        self.db.commit()
        self.db.refresh(db_exec)
        return db_exec

    def delete(self, db_exec: models.Executive):
        self.db.delete(db_exec)
        self.db.commit()
