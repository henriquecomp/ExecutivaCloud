from sqlalchemy.orm import Session
from fastapi import Depends
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.legal_organization_repository import LegalOrganizationRepository 
from app.schemas import organization_schema as schemas
from app.models import organization_model as models
from app.core.database import get_db
from typing import List, Optional

class OrganizationService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.repository = OrganizationRepository(db=db)
        self.legal_org_repo = LegalOrganizationRepository(db=db) # Dependência

    def get_organization(self, org_id: int) -> Optional[models.Organization]:
        return self.repository.get_by_id(org_id)

    def get_all_organizations(self, skip: int = 0, limit: int = 100) -> List[models.Organization]:
        return self.repository.get_all(skip=skip, limit=limit)

    def create_organization(self, org_data: schemas.OrganizationCreate) -> models.Organization:
        # Lógica de Negócio: Verificar se a LegalOrganization pai existe
        if not self.legal_org_repo.get_by_id(org_data.legalOrganizationId):
            raise ValueError("A Organização Matriz (legalOrganizationId) não existe.")

        # Lógica de Negócio: Verificar se o CNPJ já existe (se fornecido)
        if org_data.cnpj:
            if self.repository.get_by_cnpj(org_data.cnpj):
                raise ValueError("CNPJ já registrado para outra empresa.")
        
        org_dict = org_data.model_dump()
        return self.repository.create(org_dict)
    
    def update_organization(self, org_id: int, update_data: schemas.OrganizationUpdate) -> models.Organization:
        db_org = self.repository.get_by_id(org_id)
        if not db_org:
            raise ValueError("Empresa não encontrada.")
        
        update_dict = update_data.model_dump(exclude_unset=True)
        
        # Lógica de Negócio: Se o CNPJ for alterado, verifique a unicidade
        if "cnpj" in update_dict and update_dict.get("cnpj") != db_org.cnpj:
            if update_dict.get("cnpj") and self.repository.get_by_cnpj(update_dict["cnpj"]):
                raise ValueError("Novo CNPJ já está em uso.")
        
        # Lógica de Negócio: Se o legalOrganizationId for alterado, verifique se ele existe
        if "legalOrganizationId" in update_dict and update_dict["legalOrganizationId"] != db_org.legalOrganizationId:
            if not self.legal_org_repo.get_by_id(update_dict["legalOrganizationId"]):
                 raise ValueError("A nova Organização Matriz (legalOrganizationId) não existe.")
        
        return self.repository.update(db_org, update_dict)
    
    def delete_organization(self, org_id: int):
        db_org = self.repository.get_by_id(org_id)
        if not db_org:
            raise ValueError("Empresa não encontrada.")
        
        # Lógica de Negócio: Verificar se há departamentos filhos
        if db_org.departments:
             raise ValueError("Não é possível excluir. Esta empresa possui departamentos vinculados.")
        
        self.repository.delete(db_org)
        return {"message": "Empresa deletada com sucesso"}