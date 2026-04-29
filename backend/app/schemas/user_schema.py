from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field, model_validator, ConfigDict


class UsuarioBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., alias="fullName", min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = None


UserRoleLiteral = Literal[
    "master",
    "admin_legal_organization",
    "admin_company",
    "executive",
    "secretary",
]


class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=6)
    role: UserRoleLiteral = "admin_company"
    legal_organization_id: Optional[int] = Field(None, alias="legalOrganizationId")
    organization_id: Optional[int] = Field(None, alias="organizationId")
    executive_id: Optional[int] = Field(None, alias="executiveId")
    secretary_external_id: Optional[str] = Field(None, alias="secretaryId")


class UsuarioUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: Optional[str] = Field(None, alias="fullName", min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRoleLiteral] = None
    legal_organization_id: Optional[int] = Field(None, alias="legalOrganizationId")
    organization_id: Optional[int] = Field(None, alias="organizationId")
    executive_id: Optional[int] = Field(None, alias="executiveId")
    secretary_external_id: Optional[str] = Field(None, alias="secretaryId")

    @model_validator(mode="before")
    @classmethod
    def check_at_least_one_field(cls, values):
        if isinstance(values, dict) and not any(v is not None for v in values.values()):
            raise ValueError("Pelo menos um campo deve ser fornecido para a atualização.")
        return values


class Usuario(UsuarioBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    is_active: bool = Field(..., alias="isActive")
    role: UserRoleLiteral
    legal_organization_id: Optional[int] = Field(None, alias="legalOrganizationId")
    organization_id: Optional[int] = Field(None, alias="organizationId")
    executive_id: Optional[int] = Field(None, alias="executiveId")
    secretary_external_id: Optional[str] = Field(None, alias="secretaryId")
    needs_profile_completion: bool = Field(default=False, alias="needsProfileCompletion")


class UserManagementPatch(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    full_name: Optional[str] = Field(None, alias="fullName", min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = Field(None, alias="isActive")
    organization_id: Optional[int] = Field(None, alias="organizationId")


class UserManagementListResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: List[Usuario]
    total: int


class UserManagementMessageResponse(BaseModel):
    message: str
