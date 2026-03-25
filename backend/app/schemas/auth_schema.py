from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterOrganizationRequest(BaseModel):
    """Organização jurídica + administrador da organização (primeiro acesso ao tenant)."""

    model_config = ConfigDict(populate_by_name=True)

    legalName: str = Field(..., min_length=2, max_length=255)
    legalCnpj: Optional[str] = None
    legalStreet: Optional[str] = None
    legalNumber: Optional[str] = None
    legalNeighborhood: Optional[str] = None
    legalCity: Optional[str] = None
    legalState: Optional[str] = Field(None, max_length=2)
    legalZipCode: Optional[str] = None

    adminName: str = Field(..., min_length=2, max_length=100)
    adminEmail: EmailStr
    adminPassword: str = Field(..., min_length=6)


class CurrentUserOut(BaseModel):
    id: int
    fullName: str
    email: str
    role: str
    legalOrganizationId: Optional[int] = None
    organizationId: Optional[int] = None
    executiveId: Optional[int] = None
    secretaryId: Optional[str] = None


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: CurrentUserOut


class BootstrapMasterRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    email: EmailStr
    password: str = Field(..., min_length=6)
    fullName: str = Field(..., min_length=2, max_length=100)
