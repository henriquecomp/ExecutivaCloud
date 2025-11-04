from sqlalchemy.orm import Session
from fastapi import Depends
from app.repositories.legal_organization_repository import LegalOrganizationRepository
from app.schemas import legal_organization_schema as schemas
from app.models import legal_organization_model as models
from app.core.database import get_db
from typing import List, Optional

class LegalOrganizationService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.repository = LegalOrganizationRepository(db=db)

    def get_legal_organization(self, org_id: int) -> Optional[models.LegalOrganization]:
        return self.repository.get_by_id(org_id)

    def get_all_legal_organizations(self, skip: int = 0, limit: int = 100) -> List[models.LegalOrganization]:
        return self.repository.get_all(skip=skip, limit=limit)

    def create_legal_organization(self, org_data: schemas.LegalOrganizationCreate) -> models.LegalOrganization:
        # Lógica de Negócio: Verificar se o CNPJ já existe (se fornecido)
        if org_data.cnpj:
            if self.repository.get_by_cnpj(org_data.cnpj):
                raise ValueError("CNPJ já registrado.")
        
        org_dict = org_data.model_dump()
        return self.repository.create(org_dict)
    
    def update_legal_organization(self, org_id: int, update_data: schemas.LegalOrganizationUpdate) -> models.LegalOrganization:
        db_org = self.repository.get_by_id(org_id)
        if not db_org:
            raise ValueError("Organização não encontrada.")
        
        update_dict = update_data.model_dump(exclude_unset=True)
        
        # Lógica de Negócio: Se o CNPJ for alterado, verifique a unicidade
        if "cnpj" in update_dict and update_dict.get("cnpj") != db_org.cnpj:
            if update_dict.get("cnpj") and self.repository.get_by_cnpj(update_dict["cnpj"]):
                raise ValueError("Novo CNPJ já está em uso.")
        
        return self.repository.update(db_org, update_dict)
    
    def delete_legal_organization(self, org_id: int):
        db_org = self.repository.get_by_id(org_id)
        if not db_org:
            raise ValueError("Organização não encontrada.")
        
        # Lógica de Negócio: Verificar se há empresas (organizations) filhas
        if db_org.organizations:
             raise ValueError("Não é possível excluir. Esta organização possui empresas vinculadas.")
        
        self.repository.delete(db_org)
        return {"message": "Organização deletada com sucesso"}