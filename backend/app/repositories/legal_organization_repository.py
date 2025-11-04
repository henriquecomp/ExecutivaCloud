from sqlalchemy.orm import Session
from app.models import legal_organization_model as models
from typing import List, Optional, Dict, Any

class LegalOrganizationRepository:
    def __init__(self, db: Session):
        self.db = db
        self.model = models.LegalOrganization

    def get_by_id(self, org_id: int) -> Optional[models.LegalOrganization]:
        return self.db.query(self.model).filter(self.model.id == org_id).first()

    def get_by_cnpj(self, cnpj: str) -> Optional[models.LegalOrganization]:
        return self.db.query(self.model).filter(self.model.cnpj == cnpj).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[models.LegalOrganization]:
        return self.db.query(self.model).offset(skip).limit(limit).all()

    def create(self, org_data: Dict[str, Any]) -> models.LegalOrganization:
        db_org = self.model(**org_data)
        self.db.add(db_org)
        self.db.commit()
        self.db.refresh(db_org)
        return db_org

    def update(self, db_org: models.LegalOrganization, update_data: Dict[str, Any]) -> models.LegalOrganization:
        for key, value in update_data.items():
            setattr(db_org, key, value)
        self.db.commit()
        self.db.refresh(db_org)
        return db_org

    def delete(self, db_org: models.LegalOrganization):
        self.db.delete(db_org)
        self.db.commit()