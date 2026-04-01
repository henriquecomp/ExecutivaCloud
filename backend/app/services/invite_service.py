import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.invite_token import hash_invite_token
from app.core.security import create_access_token, hash_password
from app.models.executive_model import Executive
from app.models.organization_model import Organization
from app.models.secretary_model import Secretary
from app.models.user_invite_token_model import UserInviteToken
from app.models import user_model as user_models
from app.repositories.user_repository import UserRepository
from app.schemas import auth_schema as auth_schemas
from app.schemas.executive_schema import ExecutiveCreate
from app.services.auth_service import _user_to_public
from app.services.email_service import build_set_password_link, send_invite_email


InvitedRole = Literal["admin_company", "executive", "secretary"]
INVITER_ROLES = frozenset({"master", "admin_legal_organization", "admin_company"})

INVITE_DAYS = int(os.getenv("INVITE_TOKEN_DAYS", "7"))


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _assert_inviter_can_invite(inviter: user_models.Usuario) -> None:
    if inviter.role not in INVITER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para convidar usuários.",
        )


def _get_org_or_404(db: Session, organization_id: int) -> Organization:
    org = db.query(Organization).filter(Organization.id == organization_id).first()
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organização não encontrada.")
    return org


def _assert_inviter_org_scope(inviter: user_models.Usuario, org: Organization) -> None:
    if inviter.role == "master":
        return
    if inviter.role == "admin_company":
        if inviter.organization_id != org.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para esta organização.",
            )
        return
    if inviter.role == "admin_legal_organization":
        if inviter.legal_organization_id is None or org.legalOrganizationId != inviter.legal_organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para esta organização.",
            )
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para convidar usuários.")


def _require_org_for_invited_role(
    invited_role: InvitedRole,
    organization_id: Optional[int],
    inviter: user_models.Usuario,
) -> int:
    if organization_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="organizationId é obrigatório para este papel.",
        )
    if inviter.role == "master":
        return organization_id
    if inviter.role == "admin_company" and inviter.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="organizationId deve ser a empresa do administrador.",
        )
    return organization_id


class InviteService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.users = UserRepository(db)

    def invite_user(
        self,
        inviter: user_models.Usuario,
        body: auth_schemas.InviteUserRequest,
    ) -> auth_schemas.InviteUserResponse:
        _assert_inviter_can_invite(inviter)
        if body.email != body.email_confirm:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="E-mail e confirmação não coincidem.",
            )

        org_id = _require_org_for_invited_role(body.invited_role, body.organization_id, inviter)
        org = _get_org_or_404(self.db, org_id)
        _assert_inviter_org_scope(inviter, org)

        if self.users.get_by_email(str(body.email)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este e-mail já está cadastrado.",
            )

        placeholder_pw = secrets.token_urlsafe(48)
        hashed = hash_password(placeholder_pw)
        legal_lo_id = org.legalOrganizationId

        raw_token = secrets.token_urlsafe(32)
        token_hash = hash_invite_token(raw_token)
        expires_at = _utcnow() + timedelta(days=INVITE_DAYS)

        try:
            if body.invited_role == "executive":
                existing_ex = (
                    self.db.query(Executive)
                    .filter(Executive.work_email == str(body.email).lower().strip())
                    .first()
                )
                if existing_ex:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Já existe executivo com este e-mail de trabalho.",
                    )
                ex = Executive(
                    full_name=body.full_name.strip(),
                    work_email=str(body.email).lower().strip(),
                    organization_id=org.id,
                )
                self.db.add(ex)
                self.db.flush()

                user_row = user_models.Usuario(
                    name=body.full_name.strip(),
                    email=str(body.email).lower().strip(),
                    phone=None,
                    hashed_password=hashed,
                    is_active=True,
                    needs_profile_completion=True,
                    role="executive",
                    legal_organization_id=legal_lo_id,
                    organization_id=org.id,
                    executive_id=ex.id,
                    secretary_external_id=None,
                )
                self.db.add(user_row)
                self.db.flush()

            elif body.invited_role == "secretary":
                sec = Secretary(
                    full_name=body.full_name.strip(),
                    organization_id=org.id,
                    work_email=str(body.email).lower().strip(),
                    job_title=None,
                    profile_json=None,
                )
                self.db.add(sec)
                self.db.flush()

                user_row = user_models.Usuario(
                    name=body.full_name.strip(),
                    email=str(body.email).lower().strip(),
                    phone=None,
                    hashed_password=hashed,
                    is_active=True,
                    needs_profile_completion=True,
                    role="secretary",
                    legal_organization_id=legal_lo_id,
                    organization_id=org.id,
                    executive_id=None,
                    secretary_external_id=str(sec.id),
                )
                self.db.add(user_row)
                self.db.flush()

            else:
                # admin_company
                user_row = user_models.Usuario(
                    name=body.full_name.strip(),
                    email=str(body.email).lower().strip(),
                    phone=None,
                    hashed_password=hashed,
                    is_active=True,
                    needs_profile_completion=False,
                    role="admin_company",
                    legal_organization_id=legal_lo_id,
                    organization_id=org.id,
                    executive_id=None,
                    secretary_external_id=None,
                )
                self.db.add(user_row)
                self.db.flush()

            self.db.query(UserInviteToken).filter(
                UserInviteToken.user_id == user_row.id,
                UserInviteToken.used_at.is_(None),
            ).delete(synchronize_session=False)

            invite_row = UserInviteToken(
                user_id=user_row.id,
                token_hash=token_hash,
                expires_at=expires_at,
                used_at=None,
            )
            self.db.add(invite_row)
            self.db.flush()

            link = build_set_password_link(raw_token)
            send_invite_email(str(body.email), body.full_name.strip(), link)

            self.db.commit()
            self.db.refresh(user_row)
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Falha ao enviar convite (e-mail ou persistência): {e!s}",
            ) from e

        return auth_schemas.InviteUserResponse(
            userId=user_row.id,
            message="Convite enviado. O usuário receberá um e-mail para definir a senha.",
        )

    def complete_invite(self, body: auth_schemas.CompleteInviteRequest) -> auth_schemas.TokenResponse:
        if body.password != body.password_confirm:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="As senhas não coincidem.",
            )
        th = hash_invite_token(body.token.strip())
        row = (
            self.db.query(UserInviteToken)
            .filter(UserInviteToken.token_hash == th)
            .first()
        )
        if row is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Link inválido ou expirado.",
            )
        if row.used_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este link já foi utilizado.",
            )
        if _as_utc(row.expires_at) <= _utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Link expirado. Solicite um novo convite.",
            )

        user_row = self.users.get_by_id(row.user_id)
        if user_row is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário não encontrado.")

        user_row.hashed_password = hash_password(body.password)
        row.used_at = _utcnow()
        self.db.add(user_row)
        self.db.add(row)
        self.db.commit()
        self.db.refresh(user_row)

        token = create_access_token(str(user_row.id))
        return auth_schemas.TokenResponse(
            accessToken=token,
            tokenType="bearer",
            user=_user_to_public(user_row),
        )

    def invite_token_status(self, token: str) -> auth_schemas.InviteTokenStatusResponse:
        th = hash_invite_token(token.strip())
        row = (
            self.db.query(UserInviteToken)
            .filter(UserInviteToken.token_hash == th)
            .first()
        )
        if row is None:
            return auth_schemas.InviteTokenStatusResponse(valid=False)
        if row.used_at is not None or _as_utc(row.expires_at) <= _utcnow():
            return auth_schemas.InviteTokenStatusResponse(valid=False)
        return auth_schemas.InviteTokenStatusResponse(valid=True)

    def complete_executive_profile(
        self,
        user_row: user_models.Usuario,
        body: ExecutiveCreate,
    ) -> auth_schemas.CurrentUserOut:
        if user_row.role != "executive" or user_row.executive_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Perfil executivo não aplicável a este usuário.",
            )
        if str(body.work_email).lower().strip() != user_row.email.lower().strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O e-mail corporativo deve ser o mesmo do login.",
            )

        ex = self.db.query(Executive).filter(Executive.id == user_row.executive_id).first()
        if ex is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Executivo não encontrado.")

        data = body.model_dump(by_alias=False)
        if data.get("organization_id") is None and user_row.organization_id is not None:
            data["organization_id"] = user_row.organization_id
        elif (
            data.get("organization_id") is not None
            and user_row.organization_id is not None
            and data["organization_id"] != user_row.organization_id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organização inválida para este usuário.",
            )
        for key, value in data.items():
            setattr(ex, key, value)
        user_row.needs_profile_completion = False
        self.db.add(ex)
        self.db.add(user_row)
        self.db.commit()
        self.db.refresh(user_row)
        return _user_to_public(user_row)

    def complete_secretary_profile(
        self,
        user_row: user_models.Usuario,
        body: dict,
    ) -> auth_schemas.CurrentUserOut:
        if user_row.role != "secretary" or not user_row.secretary_external_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Perfil de secretária não aplicável a este usuário.",
            )
        try:
            sid = int(user_row.secretary_external_id)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Secretária inválida.")

        from app.services.secretary_service import SecretaryService, secretary_to_dict, _body_to_parts
        from sqlalchemy.orm import joinedload

        sec = (
            self.db.query(Secretary)
            .options(joinedload(Secretary.executives))
            .filter(Secretary.id == sid)
            .first()
        )
        if sec is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Secretária não encontrada.")

        merged = {**secretary_to_dict(sec), **body}
        full_name, org_id, work_email, job_title, profile, exec_ids = _body_to_parts(merged)
        if len(exec_ids) < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selecione ao menos um executivo vinculado.",
            )

        sec.full_name = full_name
        sec.organization_id = org_id
        sec.work_email = work_email
        sec.job_title = job_title
        sec.profile_json = profile
        SecretaryService(self.db)._set_executives(sec, exec_ids)
        user_row.needs_profile_completion = False
        self.db.add(sec)
        self.db.add(user_row)
        self.db.commit()
        self.db.refresh(user_row)
        return _user_to_public(user_row)
