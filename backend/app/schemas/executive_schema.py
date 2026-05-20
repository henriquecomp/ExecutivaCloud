from pydantic import BaseModel, EmailStr, Field, ConfigDict, AliasChoices
from typing import Optional
from datetime import date

from app.core.br_validators import FREE_TEXT_MAX, OptionalCpf


class ExecutiveBase(BaseModel):
    full_name: str = Field(..., alias="fullName", min_length=1, max_length=FREE_TEXT_MAX)
    cpf: OptionalCpf = None
    rg: Optional[str] = Field(None, max_length=FREE_TEXT_MAX)
    rg_issuer: Optional[str] = Field(None, alias="rgIssuer", max_length=FREE_TEXT_MAX)
    rg_issue_date: Optional[date] = Field(None, alias="rgIssueDate")
    birth_date: Optional[date] = Field(None, alias="birthDate")
    nationality: Optional[str] = Field(None, max_length=FREE_TEXT_MAX)
    place_of_birth: Optional[str] = Field(None, alias="placeOfBirth", max_length=FREE_TEXT_MAX)
    mother_name: Optional[str] = Field(None, alias="motherName", max_length=FREE_TEXT_MAX)
    father_name: Optional[str] = Field(None, alias="fatherName", max_length=FREE_TEXT_MAX)
    civil_status: Optional[str] = Field(None, alias="civilStatus", max_length=FREE_TEXT_MAX)
    work_email: EmailStr = Field(..., alias="workEmail")
    work_phone: Optional[str] = Field(None, alias="workPhone", max_length=20)
    extension: Optional[str] = Field(None, max_length=20)
    personal_email: Optional[EmailStr] = Field(None, alias="personalEmail")
    personal_phone: Optional[str] = Field(None, alias="personalPhone", max_length=20)
    street: Optional[str] = Field(
        None,
        alias="street",
        validation_alias=AliasChoices("street", "address"),
        max_length=FREE_TEXT_MAX,
    )
    linkedin_profile_url: Optional[str] = Field(None, alias="linkedinProfileUrl", max_length=255)
    job_title: Optional[str] = Field(None, alias="jobTitle", max_length=FREE_TEXT_MAX)
    organization_id: Optional[int] = Field(None, alias="organizationId")
    department_id: Optional[int] = Field(None, alias="departmentId")
    cost_center: Optional[str] = Field(None, alias="costCenter", max_length=FREE_TEXT_MAX)
    employee_id: Optional[str] = Field(None, alias="employeeId", max_length=FREE_TEXT_MAX)
    reports_to_executive_id: Optional[int] = Field(None, alias="reportsToExecutiveId")
    hire_date: Optional[date] = Field(None, alias="hireDate")
    work_location: Optional[str] = Field(None, alias="workLocation", max_length=FREE_TEXT_MAX)
    photo_url: Optional[str] = Field(None, alias="photoUrl", max_length=255)
    bio: Optional[str] = Field(None, max_length=FREE_TEXT_MAX)
    education: Optional[str] = Field(None, max_length=FREE_TEXT_MAX)
    languages: Optional[str] = Field(None, max_length=FREE_TEXT_MAX)
    emergency_contact_name: Optional[str] = Field(None, alias="emergencyContactName", max_length=FREE_TEXT_MAX)
    emergency_contact_phone: Optional[str] = Field(None, alias="emergencyContactPhone", max_length=20)
    emergency_contact_relation: Optional[str] = Field(
        None, alias="emergencyContactRelation", max_length=FREE_TEXT_MAX
    )
    dependents_info: Optional[str] = Field(None, alias="dependentsInfo", max_length=FREE_TEXT_MAX)
    bank_info: Optional[str] = Field(None, alias="bankInfo", max_length=FREE_TEXT_MAX)
    compensation_info: Optional[str] = Field(None, alias="compensationInfo", max_length=FREE_TEXT_MAX)
    system_access_levels: Optional[str] = Field(None, alias="systemAccessLevels", max_length=FREE_TEXT_MAX)

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class ExecutiveCreate(ExecutiveBase):
    pass


class ExecutiveUpdate(ExecutiveBase):
    full_name: Optional[str] = Field(None, alias="fullName", min_length=1, max_length=FREE_TEXT_MAX)
    work_email: Optional[EmailStr] = Field(None, alias="workEmail")


class Executive(ExecutiveBase):
    id: int
