import os
from typing import Optional

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models import user_model as user_models
from app.repositories.legal_organization_repository import LegalOrganizationRepository
from app.repositories.user_repository import UserRepository
from app.schemas import auth_schema as auth_schemas


def _user_to_public(u: user_models.Usuario) -> auth_schemas.CurrentUserOut:
    return auth_schemas.CurrentUserOut(
        id=u.id,
        fullName=u.name,
        email=u.email,
        role=u.role,
        legalOrganizationId=u.legal_organization_id,
        organizationId=u.organization_id,
        executiveId=u.executive_id,
        secretaryId=u.secretary_external_id,
    )


class AuthService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.users = UserRepository(db)
        self.legal_orgs = LegalOrganizationRepository(db)

    def login(self, email: str, password: str) -> auth_schemas.TokenResponse:
        user = self.users.get_by_email(email)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos.",
            )
        if not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos.",
            )
        token = create_access_token(str(user.id))
        return auth_schemas.TokenResponse(
            accessToken=token,
            tokenType="bearer",
            user=_user_to_public(user),
        )

    def register_organization(self, body: auth_schemas.RegisterOrganizationRequest) -> auth_schemas.TokenResponse:
        if self.users.get_by_email(body.adminEmail):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este e-mail já está cadastrado.",
            )
        lo_data = {
            "name": body.legalName,
            "cnpj": body.legalCnpj,
            "street": body.legalStreet,
            "number": body.legalNumber,
            "neighborhood": body.legalNeighborhood,
            "city": body.legalCity,
            "state": body.legalState,
            "zipCode": body.legalZipCode,
        }
        lo = self.legal_orgs.create(lo_data)
        hashed = hash_password(body.adminPassword)
        db_user = self.users.create(
            {
                "name": body.adminName,
                "email": body.adminEmail,
                "phone": None,
                "hashed_password": hashed,
                "is_active": True,
                "role": "admin_legal_organization",
                "legal_organization_id": lo.id,
                "organization_id": None,
                "executive_id": None,
                "secretary_external_id": None,
            }
        )
        token = create_access_token(str(db_user.id))
        return auth_schemas.TokenResponse(accessToken=token, tokenType="bearer", user=_user_to_public(db_user))

    def bootstrap_master(
        self,
        setup_token: Optional[str],
        body: auth_schemas.BootstrapMasterRequest,
    ) -> auth_schemas.TokenResponse:
        expected = os.getenv("EXECUTIVA_SETUP_TOKEN", "")
        if not expected or setup_token != expected:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token de setup inválido.")
        existing = (
            self.db.query(user_models.Usuario)
            .filter(user_models.Usuario.role == "master")
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuário master já existe.",
            )
        if self.users.get_by_email(body.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este e-mail já está cadastrado.",
            )
        db_user = self.users.create(
            {
                "name": body.fullName,
                "email": body.email,
                "phone": None,
                "hashed_password": hash_password(body.password),
                "is_active": True,
                "role": "master",
                "legal_organization_id": None,
                "organization_id": None,
                "executive_id": None,
                "secretary_external_id": None,
            }
        )
        token = create_access_token(str(db_user.id))
        return auth_schemas.TokenResponse(accessToken=token, tokenType="bearer", user=_user_to_public(db_user))
