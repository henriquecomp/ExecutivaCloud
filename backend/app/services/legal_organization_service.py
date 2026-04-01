from sqlalchemy.orm import Session, selectinload
from fastapi import Depends
from app.repositories.legal_organization_repository import LegalOrganizationRepository
from app.schemas import legal_organization_schema as schemas
from app.models import legal_organization_model as models
from app.models.executive_model import Executive
from app.models.organization_model import Organization
from app.models.secretary_model import Secretary
from app.models.user_model import Usuario
from app.core.database import get_db
from typing import List, Optional


class LegalOrganizationDeletionBlocked(Exception):
    """Impede exclusão da matriz enquanto houver vínculos; use `.detail` no HTTP 409."""

    def __init__(self, detail: dict):
        self.detail = detail
        super().__init__(detail.get("message", "Exclusão bloqueada."))


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

        child_orgs = (
            self.db.query(Organization)
            .filter(Organization.legalOrganizationId == org_id)
            .options(
                selectinload(Organization.departments),
                selectinload(Organization.executives),
            )
            .all()
        )

        organizations_payload = []
        for co in child_orgs:
            departments = co.departments or []
            executives = co.executives or []
            organizations_payload.append(
                {
                    "id": co.id,
                    "name": co.name,
                    "departmentCount": len(departments),
                    "executiveCount": len(executives),
                }
            )

        users_rows = (
            self.db.query(Usuario)
            .filter(Usuario.legal_organization_id == org_id)
            .all()
        )
        users_payload = [
            {
                "id": u.id,
                "email": u.email,
                "fullName": u.name,
                "role": u.role,
            }
            for u in users_rows
        ]

        org_id_list = [co.id for co in child_orgs]
        merged_secretaries: dict[int, Secretary] = {}
        if org_id_list:
            for s in (
                self.db.query(Secretary)
                .filter(Secretary.organization_id.in_(org_id_list))
                .all()
            ):
                merged_secretaries[s.id] = s
            for s in (
                self.db.query(Secretary)
                .join(Secretary.executives)
                .filter(Executive.organization_id.in_(org_id_list))
                .distinct()
                .all()
            ):
                merged_secretaries[s.id] = s
        secretaries_payload = [
            {
                "id": s.id,
                "fullName": s.full_name,
                "workEmail": s.work_email or "",
            }
            for s in merged_secretaries.values()
        ]

        if organizations_payload or users_payload or secretaries_payload:
            raise LegalOrganizationDeletionBlocked(
                {
                    "message": (
                        "Não é possível excluir esta organização jurídica enquanto existirem vínculos. "
                        "Remova ou transfira os itens abaixo antes de tentar novamente."
                    ),
                    "blockers": {
                        "organizations": organizations_payload,
                        "users": users_payload,
                        "secretaries": secretaries_payload,
                    },
                }
            )

        self.repository.delete(db_org)
        return {"message": "Organização deletada com sucesso"}