from sqlalchemy.orm import Session
from app.models import organization_model as models
from typing import List, Optional, Dict, Any

class OrganizationRepository:
    def __init__(self, db: Session):
        self.db = db
        self.model = models.Organization

    def get_by_id(self, org_id: int) -> Optional[models.Organization]:
        return self.db.query(self.model).filter(self.model.id == org_id).first()
    
    def get_by_cnpj(self, cnpj: str) -> Optional[models.Organization]:
        return self.db.query(self.model).filter(self.model.cnpj == cnpj).first()

    def get_by_legal_org_id(self, legal_org_id: int) -> List[models.Organization]:
        return self.db.query(self.model).filter(self.model.legalOrganizationId == legal_org_id).all()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[models.Organization]:
        return self.db.query(self.model).offset(skip).limit(limit).all()

    def create(self, org_data: Dict[str, Any]) -> models.Organization:
        db_org = self.model(**org_data)
        self.db.add(db_org)
        self.db.commit()
        self.db.refresh(db_org)
        return db_org

    def update(self, db_org: models.Organization, update_data: Dict[str, Any]) -> models.Organization:
        for key, value in update_data.items():
            setattr(db_org, key, value)
        self.db.commit()
        self.db.refresh(db_org)
        return db_org

    def delete(self, db_org: models.Organization):
        self.db.delete(db_org)
        self.db.commit()