from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.core.br_validators import (
    FREE_TEXT_MAX,
    OptionalComplement,
    RequiredCep,
    RequiredCnpj,
    RequiredUf,
)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterOrganizationRequest(BaseModel):
    """Organização jurídica + administrador da organização (primeiro acesso ao tenant)."""

    model_config = ConfigDict(populate_by_name=True)

    legalName: str = Field(..., min_length=2, max_length=FREE_TEXT_MAX)
    legalCnpj: RequiredCnpj
    legalStreet: str = Field(..., min_length=1, max_length=FREE_TEXT_MAX)
    legalNumber: str = Field(..., min_length=1, max_length=FREE_TEXT_MAX)
    legalNeighborhood: str = Field(..., min_length=1, max_length=FREE_TEXT_MAX)
    legalCity: str = Field(..., min_length=1, max_length=FREE_TEXT_MAX)
    legalState: RequiredUf
    legalZipCode: RequiredCep
    legalComplement: OptionalComplement = Field(None, alias="legalComplement")

    adminName: str = Field(..., min_length=2, max_length=100)
    adminEmail: EmailStr


class RegisterOrganizationResponse(BaseModel):
    message: str


class CurrentUserOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: int
    fullName: str
    email: str
    phone: Optional[str] = None
    role: str
    legalOrganizationId: Optional[int] = None
    organizationId: Optional[int] = None
    executiveId: Optional[int] = None
    secretaryId: Optional[str] = None
    needsProfileCompletion: bool = False


class MeProfileUpdate(BaseModel):
    """Atualização dos dados cadastrais do próprio utilizador autenticado."""

    model_config = ConfigDict(populate_by_name=True)

    full_name: Optional[str] = Field(None, alias="fullName", min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: CurrentUserOut


class BootstrapMasterRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    email: EmailStr
    password: str = Field(..., min_length=6)
    fullName: str = Field(..., min_length=2, max_length=100)


InvitedRoleLiteral = Literal["admin_company", "executive", "secretary"]


class InviteUserRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    full_name: str = Field(..., alias="fullName", min_length=2, max_length=100)
    email: EmailStr
    email_confirm: EmailStr = Field(..., alias="emailConfirm")
    invited_role: InvitedRoleLiteral = Field(..., alias="invitedRole")
    organization_id: Optional[int] = Field(None, alias="organizationId")
    secretary_executive_ids: Optional[List[int]] = Field(None, alias="secretaryExecutiveIds")


class InviteUserResponse(BaseModel):
    userId: int
    message: str


class CompleteInviteRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    token: str = Field(..., min_length=10)
    password: str = Field(..., min_length=6)
    password_confirm: str = Field(..., alias="passwordConfirm", min_length=6)


class InviteTokenStatusResponse(BaseModel):
    valid: bool
