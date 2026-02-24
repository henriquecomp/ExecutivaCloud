from sqlalchemy.orm import Session
from app.models.secretary_model import Secretary
from app.models.executive_model import Executive
from app.schemas.secretary_schema import SecretaryCreate

class SecretaryRepository:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(Secretary).offset(skip).limit(limit).all()

    def get_by_id(self, db: Session, secretary_id: int):
        return db.query(Secretary).filter(Secretary.id == secretary_id).first()

    def get_by_cpf(self, db: Session, cpf: str):
        return db.query(Secretary).filter(Secretary.cpf == cpf).first()

    def create(self, db: Session, secretary_data: SecretaryCreate):
        # Remove a lista de IDs do dicionário principal para tratar separadamente
        data = secretary_data.model_dump(by_alias=False, exclude={"executive_ids"})
        db_secretary = Secretary(**data)
        
        # Gerenciamento da relação Many-to-Many
        if secretary_data.executive_ids:
            executives = db.query(Executive).filter(Executive.id.in_(secretary_data.executive_ids)).all()
            db_secretary.executives = executives
        
        db.add(db_secretary)
        db.commit()
        db.refresh(db_secretary)
        return db_secretary

    def update(self, db: Session, db_secretary: Secretary, data: dict):
        executive_ids = data.pop("executive_ids", None)
        
        for key, value in data.items():
            setattr(db_secretary, key, value)
            
        if executive_ids is not None:
            executives = db.query(Executive).filter(Executive.id.in_(executive_ids)).all()
            db_secretary.executives = executives
            
        db.commit()
        db.refresh(db_secretary)
        return db_secretary

    def delete(self, db: Session, db_secretary: Secretary):
        db.delete(db_secretary)
        db.commit()