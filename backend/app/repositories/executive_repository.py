from sqlalchemy.orm import Session
from app.models.executive_model import Executive
from app.schemas.executive_schema import ExecutiveCreate


class ExecutiveRepository:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(Executive).offset(skip).limit(limit).all()

    def get_by_id(self, db: Session, executive_id: int):
        return db.query(Executive).filter(Executive.id == executive_id).first()

    def get_by_email(self, db: Session, email: str):
        return db.query(Executive).filter(Executive.work_email == email).first()

    def create(self, db: Session, executive: ExecutiveCreate):
        # by_alias=False garante o uso dos nomes internos como 'street' para o banco
        data = executive.model_dump(by_alias=False)
        db_executive = Executive(**data)
        db.add(db_executive)
        db.commit()
        db.refresh(db_executive)
        return db_executive

    def update(self, db: Session, db_executive: Executive, data: dict):
        for key, value in data.items():
            setattr(db_executive, key, value)
        db.commit()
        db.refresh(db_executive)
        return db_executive

    def delete(self, db: Session, db_executive: Executive):
        db.delete(db_executive)
        db.commit()
