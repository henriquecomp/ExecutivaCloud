from typing import List, Optional, Tuple

from fastapi import Depends, HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.executive_model import Executive
from app.models.organization_model import Organization
from app.models.secretary_model import Secretary
from app.models import user_model as user_models
from app.repositories.user_repository import UserRepository
from app.schemas import user_schema as schemas

MANAGER_ROLES = frozenset({"master", "admin_legal_organization", "admin_company"})

# Escopo de listagem / edição em /users/management:
# - master: todos os usuários do sistema (qualquer organização, empresa ou papel).
# - admin_legal_organization / admin_company: apenas usuários dentro da respectiva árvore;
#   não enxergam contas master nem fora do escopo.


def assert_user_manager(actor: user_models.Usuario) -> None:
    if actor.role not in MANAGER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para gerenciar usuários.",
        )


def _org_ids_under_legal(db: Session, legal_organization_id: int) -> List[int]:
    rows = (
        db.query(Organization.id)
        .filter(Organization.legalOrganizationId == legal_organization_id)
        .all()
    )
    return [r[0] for r in rows]


def user_in_manager_scope(db: Session, actor: user_models.Usuario, target: user_models.Usuario) -> bool:
    if actor.role == "master":
        return True
    if target.role == "master":
        return False
    if actor.role == "admin_company":
        return target.organization_id is not None and target.organization_id == actor.organization_id
    if actor.role == "admin_legal_organization":
        if actor.legal_organization_id is None:
            return False
        if target.legal_organization_id == actor.legal_organization_id:
            return True
        if target.organization_id is not None:
            org = db.query(Organization).filter(Organization.id == target.organization_id).first()
            return bool(org and org.legalOrganizationId == actor.legal_organization_id)
        return False
    return False


def _scoped_users_query(db: Session, actor: user_models.Usuario):
    """Consulta base para listagem; sem filtro territorial somente para administrador geral (master)."""
    q = db.query(user_models.Usuario)
    if actor.role == "master":
        return q
    if actor.role == "admin_company":
        return q.filter(
            user_models.Usuario.organization_id == actor.organization_id,
            user_models.Usuario.role != "master",
        )
    if actor.role == "admin_legal_organization":
        if actor.legal_organization_id is None:
            return q.filter(False)
        org_ids = _org_ids_under_legal(db, actor.legal_organization_id)
        conds = [user_models.Usuario.legal_organization_id == actor.legal_organization_id]
        if org_ids:
            conds.append(user_models.Usuario.organization_id.in_(org_ids))
        return q.filter(or_(*conds), user_models.Usuario.role != "master")
    return q.filter(False)


class UserManagementService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.users = UserRepository(db)

    def list_users(
        self,
        actor: user_models.Usuario,
        q: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[user_models.Usuario], int]:
        assert_user_manager(actor)
        query = _scoped_users_query(self.db, actor)
        if q and q.strip():
            term = f"%{q.strip().lower()}%"
            query = query.filter(
                or_(
                    func.lower(user_models.Usuario.name).like(term),
                    func.lower(user_models.Usuario.email).like(term),
                )
            )
        total = query.count()
        rows = (
            query.order_by(user_models.Usuario.name)
            .offset(max(skip, 0))
            .limit(min(max(limit, 1), 200))
            .all()
        )
        return rows, total

    def get_user(self, actor: user_models.Usuario, user_id: int) -> user_models.Usuario:
        assert_user_manager(actor)
        row = self.users.get_by_id(user_id)
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
        if not user_in_manager_scope(self.db, actor, row):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para este usuário.")
        return row

    def patch_user(
        self,
        actor: user_models.Usuario,
        user_id: int,
        body: schemas.UserManagementPatch,
    ) -> user_models.Usuario:
        assert_user_manager(actor)
        target = self.get_user(actor, user_id)
        if actor.role != "master" and target.role == "master":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão.")

        data = body.model_dump(exclude_unset=True, by_alias=False)
        updates: dict = {}
        if "full_name" in data and data["full_name"] is not None:
            updates["name"] = data["full_name"].strip()
        if "email" in data and data["email"] is not None:
            new_email = str(data["email"]).lower().strip()
            if new_email != target.email.lower():
                if self.users.get_by_email(new_email):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Este e-mail já está em uso.",
                    )
            updates["email"] = new_email
        if "phone" in data:
            updates["phone"] = data["phone"]
        if "is_active" in data and data["is_active"] is not None:
            if target.id == actor.id and data["is_active"] is False:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Não é possível inativar a própria conta por aqui.",
                )
            updates["is_active"] = data["is_active"]

        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nenhum dado para atualizar.",
            )

        db_user = self.users.update(target, updates)

        new_email = updates.get("email")
        touched = False
        if new_email and db_user.executive_id:
            ex = self.db.query(Executive).filter(Executive.id == db_user.executive_id).first()
            if ex:
                ex.work_email = new_email
                self.db.add(ex)
                touched = True
        if new_email and db_user.secretary_external_id:
            try:
                sid = int(db_user.secretary_external_id)
            except ValueError:
                sid = None
            if sid is not None:
                sec = self.db.query(Secretary).filter(Secretary.id == sid).first()
                if sec:
                    sec.work_email = new_email
                    self.db.add(sec)
                    touched = True
        if touched:
            self.db.commit()
            self.db.refresh(db_user)
        return db_user

    def deactivate_user(self, actor: user_models.Usuario, user_id: int) -> user_models.Usuario:
        assert_user_manager(actor)
        target = self.get_user(actor, user_id)
        if target.id == actor.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível inativar a própria conta.",
            )
        return self.users.update(target, {"is_active": False})
