from pydantic import BaseModel, Field, model_validator
from typing import Optional

from app.core.br_validators import (
    FREE_TEXT_MAX,
    OptionalComplement,
    RequiredCep,
    RequiredCnpj,
    RequiredUf,
)


class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=FREE_TEXT_MAX)
    legalOrganizationId: int
    cnpj: RequiredCnpj
    street: str = Field(..., min_length=1, max_length=FREE_TEXT_MAX)
    number: str = Field(..., min_length=1, max_length=FREE_TEXT_MAX)
    neighborhood: str = Field(..., min_length=1, max_length=FREE_TEXT_MAX)
    city: str = Field(..., min_length=1, max_length=FREE_TEXT_MAX)
    state: RequiredUf
    zipCode: RequiredCep
    complement: OptionalComplement = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=FREE_TEXT_MAX)
    legalOrganizationId: Optional[int] = None
    cnpj: Optional[str] = None
    street: Optional[str] = Field(None, max_length=FREE_TEXT_MAX)
    number: Optional[str] = Field(None, max_length=FREE_TEXT_MAX)
    neighborhood: Optional[str] = Field(None, max_length=FREE_TEXT_MAX)
    city: Optional[str] = Field(None, max_length=FREE_TEXT_MAX)
    state: Optional[str] = Field(None, max_length=2)
    zipCode: Optional[str] = None
    complement: OptionalComplement = None

    @model_validator(mode="after")
    def validate_address_when_partial(self):
        from app.core.br_validators import validate_cnpj, validate_cep, validate_uf

        address_keys = (
            "cnpj",
            "street",
            "number",
            "neighborhood",
            "city",
            "state",
            "zipCode",
        )
        provided = {k: getattr(self, k) for k in address_keys if getattr(self, k) is not None}
        if not provided:
            return self
        if self.cnpj is not None:
            validate_cnpj(self.cnpj)
        if self.zipCode is not None:
            validate_cep(self.zipCode)
        if self.state is not None:
            validate_uf(self.state)
        required_on_update = ("cnpj", "street", "number", "neighborhood", "city", "state", "zipCode")
        missing = [k for k in required_on_update if getattr(self, k) is None]
        if missing:
            raise ValueError(
                "Ao atualizar endereço, informe CNPJ e endereço completo (logradouro, número, bairro, cidade, UF e CEP)."
            )
        return self


class Organization(OrganizationBase):
    id: int

    class Config:
        from_attributes = True
