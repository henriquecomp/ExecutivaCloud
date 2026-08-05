from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.executive_model import Executive
from app.models import user_model as user_models
from app.services.user_management_service import MANAGER_ROLES, _org_ids_under_legal


def assert_executive_manager(actor: user_models.Usuario) -> None:
    if actor.role not in MANAGER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para acessar executivos.",
        )


def resolve_actor_organization_id(
    db: Session, actor: user_models.Usuario
) -> Optional[int]:
    """Empresa (organizations.id) do ator — não a organização jurídica."""
    if actor.organization_id is not None:
        return actor.organization_id
    if actor.role == "executive" and actor.executive_id is not None:
        ex = db.query(Executive).filter(Executive.id == actor.executive_id).first()
        if ex is not None and ex.organization_id is not None:
            return ex.organization_id
    return None


def executive_in_manager_scope(
    db: Session, actor: user_models.Usuario, executive: Executive
) -> bool:
    if actor.role == "master":
        return True
    org_id = executive.organization_id
    if org_id is None:
        return False
    if actor.role == "admin_company":
        return actor.organization_id is not None and org_id == actor.organization_id
    if actor.role == "admin_legal_organization":
        if actor.legal_organization_id is None:
            return False
        return org_id in _org_ids_under_legal(db, actor.legal_organization_id)
    return False


def scoped_executives_query(db: Session, actor: user_models.Usuario):
    q = db.query(Executive)
    if actor.role == "master":
        return q
    if actor.role == "admin_company":
        if actor.organization_id is None:
            return q.filter(False)
        return q.filter(Executive.organization_id == actor.organization_id)
    if actor.role == "admin_legal_organization":
        if actor.legal_organization_id is None:
            return q.filter(False)
        org_ids = _org_ids_under_legal(db, actor.legal_organization_id)
        if not org_ids:
            return q.filter(False)
        return q.filter(Executive.organization_id.in_(org_ids))
    if actor.role == "executive":
        org_id = resolve_actor_organization_id(db, actor)
        if org_id is None:
            return q.filter(False)
        # Gestores / pares: só executivos com conta de usuário ativa na mesma empresa
        return (
            q.filter(Executive.organization_id == org_id)
            .join(
                user_models.Usuario,
                user_models.Usuario.executive_id == Executive.id,
            )
            .filter(user_models.Usuario.is_active.is_(True))
            .distinct()
        )
    return q.filter(False)
