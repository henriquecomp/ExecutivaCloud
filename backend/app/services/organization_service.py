from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.legal_organization_repository import LegalOrganizationRepository
from app.schemas import organization_schema as schemas
from app.models import organization_model as models
from app.models import user_model as user_models
from app.core.database import get_db
from app.core.br_validators import normalize_cnpj_raw
from app.services.organization_scope import (
    assert_organization_in_scope,
    assert_organization_manager,
    scoped_organizations_query,
)
from typing import List, Optional


class OrganizationService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.repository = OrganizationRepository(db=db)
        self.legal_org_repo = LegalOrganizationRepository(db=db)

    def get_organization(
        self, org_id: int, actor: user_models.Usuario
    ) -> Optional[models.Organization]:
        db_org = self.repository.get_by_id(org_id)
        if db_org is None:
            return None
        assert_organization_in_scope(actor, db_org)
        return db_org

    def get_all_organizations(
        self, actor: user_models.Usuario, skip: int = 0, limit: int = 100
    ) -> List[models.Organization]:
        return (
            scoped_organizations_query(self.db, actor)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_organization(
        self, org_data: schemas.OrganizationCreate, actor: user_models.Usuario
    ) -> models.Organization:
        assert_organization_manager(actor)

        org_dict = org_data.model_dump()
        if actor.role == "admin_legal_organization":
            if actor.legal_organization_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Administrador da organização deve estar vinculado a uma matriz.",
                )
            org_dict["legalOrganizationId"] = actor.legal_organization_id
        elif actor.role == "master":
            legal_id = org_dict.get("legalOrganizationId")
            if legal_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Informe a organização matriz (legalOrganizationId).",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para cadastrar empresas.",
            )

        if not self.legal_org_repo.get_by_id(org_dict["legalOrganizationId"]):
            raise ValueError("A Organização Matriz (legalOrganizationId) não existe.")

        if org_dict.get("cnpj"):
            if self.repository.get_by_cnpj(org_dict["cnpj"]):
                raise ValueError("CNPJ já registrado para outra empresa.")

        return self.repository.create(org_dict)

    def update_organization(
        self,
        org_id: int,
        update_data: schemas.OrganizationUpdate,
        actor: user_models.Usuario,
    ) -> models.Organization:
        db_org = self.repository.get_by_id(org_id)
        if not db_org:
            raise ValueError("Empresa não encontrada.")
        assert_organization_in_scope(actor, db_org)

        update_dict = update_data.model_dump(exclude_unset=True)

        if "cnpj" in update_dict:
            incoming = normalize_cnpj_raw(update_dict.get("cnpj") or "")
            persisted = normalize_cnpj_raw(db_org.cnpj or "")
            if incoming != persisted:
                raise ValueError("CNPJ não pode ser alterado.")
            update_dict["cnpj"] = persisted

        if "legalOrganizationId" in update_dict:
            new_legal = update_dict["legalOrganizationId"]
            if actor.role == "admin_legal_organization":
                # Matriz não pode realocar empresa para outra organização
                update_dict["legalOrganizationId"] = actor.legal_organization_id
            elif new_legal != db_org.legalOrganizationId:
                if not self.legal_org_repo.get_by_id(new_legal):
                    raise ValueError(
                        "A nova Organização Matriz (legalOrganizationId) não existe."
                    )

        return self.repository.update(db_org, update_dict)

    def delete_organization(self, org_id: int, actor: user_models.Usuario):
        db_org = self.repository.get_by_id(org_id)
        if not db_org:
            raise ValueError("Empresa não encontrada.")
        assert_organization_in_scope(actor, db_org)

        if db_org.departments:
            raise ValueError(
                "Não é possível excluir. Esta empresa possui departamentos vinculados."
            )

        self.repository.delete(db_org)
        return {"message": "Empresa deletada com sucesso"}
