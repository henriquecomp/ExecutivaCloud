from fastapi import HTTPException, status
from sqlalchemy.orm import Session, Query

from app.models import user_model as user_models
from app.models.organization_model import Organization

ORG_MANAGER_ROLES = frozenset({"master", "admin_legal_organization"})


def assert_organization_manager(actor: user_models.Usuario) -> None:
    if actor.role not in ORG_MANAGER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para acessar empresas.",
        )


def organization_in_manager_scope(
    actor: user_models.Usuario, org: Organization
) -> bool:
    if actor.role == "master":
        return True
    if actor.role == "admin_legal_organization":
        if actor.legal_organization_id is None:
            return False
        return org.legalOrganizationId == actor.legal_organization_id
    return False


def assert_organization_in_scope(
    actor: user_models.Usuario, org: Organization
) -> None:
    assert_organization_manager(actor)
    if not organization_in_manager_scope(actor, org):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para acessar esta empresa.",
        )


def scoped_organizations_query(db: Session, actor: user_models.Usuario) -> Query:
    assert_organization_manager(actor)
    q = db.query(Organization)
    if actor.role == "master":
        return q
    if actor.role == "admin_legal_organization":
        if actor.legal_organization_id is None:
            return q.filter(False)
        return q.filter(Organization.legalOrganizationId == actor.legal_organization_id)
    return q.filter(False)
