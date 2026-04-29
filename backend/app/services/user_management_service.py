import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple

from fastapi import Depends, HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.invite_token import hash_invite_token
from app.models.department_model import Department
from app.models.executive_model import Executive
from app.models.organization_model import Organization
from app.models.secretary_model import Secretary
from app.models.user_invite_token_model import UserInviteToken
from app.models import user_model as user_models
from app.repositories.user_repository import UserRepository
from app.schemas import user_schema as schemas
from app.services.email_service import (
    build_set_password_link,
    send_invite_email,
    send_password_reset_email,
)

MANAGER_ROLES = frozenset({"master", "admin_legal_organization", "admin_company"})
INVITE_DAYS = int(os.getenv("INVITE_TOKEN_DAYS", "7"))


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)

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

    def _apply_organization_reallocation(
        self,
        actor: user_models.Usuario,
        target: user_models.Usuario,
        new_org_id: int,
    ) -> Organization:
        """Valida e atualiza empresa no perfil de executivo/secretária (mantém users.organization_id em sync)."""
        if actor.role not in ("master", "admin_legal_organization"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para alterar a empresa deste usuário.",
            )
        if target.role not in ("executive", "secretary"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Alteração de empresa aplica-se apenas a executivos e secretárias.",
            )
        org = self.db.query(Organization).filter(Organization.id == new_org_id).first()
        if org is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada.")
        if actor.role == "admin_legal_organization":
            if actor.legal_organization_id is None or org.legalOrganizationId != actor.legal_organization_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Empresa fora do âmbito da sua organização jurídica.",
                )

        if target.executive_id:
            ex = self.db.query(Executive).filter(Executive.id == target.executive_id).first()
            if ex:
                ex.organization_id = new_org_id
                if ex.department_id:
                    dept = self.db.query(Department).filter(Department.id == ex.department_id).first()
                    if dept is None or getattr(dept, "organizationId", None) != new_org_id:
                        ex.department_id = None
                self.db.add(ex)

        if target.secretary_external_id:
            try:
                sid = int(target.secretary_external_id)
            except ValueError:
                sid = None
            if sid is not None:
                sec = self.db.query(Secretary).filter(Secretary.id == sid).first()
                if sec:
                    sec.organization_id = new_org_id
                    self.db.add(sec)

        return org

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

        if "organization_id" in data:
            if actor.role == "admin_company":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Sem permissão para alterar a empresa pelo cadastro de usuários.",
                )
            if data["organization_id"] is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Selecione uma empresa.",
                )
            new_org_id = int(data["organization_id"])
            org_row = self._apply_organization_reallocation(actor, target, new_org_id)
            updates["organization_id"] = new_org_id
            updates["legal_organization_id"] = org_row.legalOrganizationId

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

    def _issue_new_set_password_token(self, user_id: int) -> str:
        """Remove tokens não usados do usuário, cria um novo e devolve o token em texto plano (para o link)."""
        self.db.query(UserInviteToken).filter(
            UserInviteToken.user_id == user_id,
            UserInviteToken.used_at.is_(None),
        ).delete(synchronize_session=False)

        raw_token = secrets.token_urlsafe(32)
        token_hash = hash_invite_token(raw_token)
        expires_at = _utcnow() + timedelta(days=INVITE_DAYS)
        invite_row = UserInviteToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            used_at=None,
        )
        self.db.add(invite_row)
        self.db.flush()
        return raw_token

    def resend_first_access_email(
        self,
        actor: user_models.Usuario,
        user_id: int,
    ) -> schemas.UserManagementMessageResponse:
        """Reenvia o e-mail com link de primeiro acesso (definir senha) para perfil ainda pendente."""
        assert_user_manager(actor)
        target = self.get_user(actor, user_id)

        if target.id == actor.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível reenviar o convite para a própria conta.",
            )
        if not target.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuário inativo.",
            )
        if not bool(getattr(target, "needs_profile_completion", False)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reenvio disponível apenas para usuários com primeiro acesso pendente.",
            )

        try:
            raw_token = self._issue_new_set_password_token(target.id)
            link = build_set_password_link(raw_token)
            send_invite_email(str(target.email), str(target.name).strip(), link)
            self.db.commit()
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Falha ao enviar e-mail: {e!s}",
            ) from e

        return schemas.UserManagementMessageResponse(
            message="E-mail de primeiro acesso reenviado.",
        )

    def send_password_reset_email(
        self,
        actor: user_models.Usuario,
        user_id: int,
    ) -> schemas.UserManagementMessageResponse:
        """Envia link para redefinir senha (usuários que já concluíram o primeiro acesso)."""
        assert_user_manager(actor)
        target = self.get_user(actor, user_id)

        if target.id == actor.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível solicitar redefinição para a própria conta por aqui.",
            )
        if not target.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuário inativo.",
            )
        if bool(getattr(target, "needs_profile_completion", False)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este usuário ainda tem primeiro acesso pendente. Use «Reenviar primeiro acesso».",
            )

        try:
            raw_token = self._issue_new_set_password_token(target.id)
            link = build_set_password_link(raw_token)
            send_password_reset_email(str(target.email), str(target.name).strip(), link)
            self.db.commit()
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Falha ao enviar e-mail: {e!s}",
            ) from e

        return schemas.UserManagementMessageResponse(
            message="E-mail com link de redefinição de senha enviado.",
        )
