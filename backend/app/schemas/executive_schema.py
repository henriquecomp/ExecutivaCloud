from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import date


class ExecutiveBase(BaseModel):
    full_name: str = Field(..., alias="fullName")
    cpf: Optional[str] = None
    rg: Optional[str] = None
    rg_issuer: Optional[str] = Field(None, alias="rgIssuer")
    rg_issue_date: Optional[date] = Field(None, alias="rgIssueDate")
    birth_date: Optional[date] = Field(None, alias="birthDate")
    nationality: Optional[str] = None
    place_of_birth: Optional[str] = Field(None, alias="placeOfBirth")
    mother_name: Optional[str] = Field(None, alias="motherName")
    father_name: Optional[str] = Field(None, alias="fatherName")
    civil_status: Optional[str] = Field(None, alias="civilStatus")
    work_email: EmailStr = Field(..., alias="workEmail")
    work_phone: Optional[str] = Field(None, alias="workPhone")
    extension: Optional[str] = None
    personal_email: Optional[EmailStr] = Field(None, alias="personalEmail")
    personal_phone: Optional[str] = Field(None, alias="personalPhone")
    street: Optional[str] = Field(
        None, alias="address"
    )  # Mantendo street como original e address como alias
    linkedin_profile_url: Optional[str] = Field(None, alias="linkedinProfileUrl")
    job_title: Optional[str] = Field(None, alias="jobTitle")
    organization_id: Optional[int] = Field(None, alias="organizationId")
    department_id: Optional[int] = Field(None, alias="departmentId")
    cost_center: Optional[str] = Field(None, alias="costCenter")
    employee_id: Optional[str] = Field(None, alias="employeeId")
    reports_to_executive_id: Optional[int] = Field(None, alias="reportsToExecutiveId")
    hire_date: Optional[date] = Field(None, alias="hireDate")
    work_location: Optional[str] = Field(None, alias="workLocation")
    photo_url: Optional[str] = Field(None, alias="photoUrl")
    bio: Optional[str] = None
    education: Optional[str] = None
    languages: Optional[str] = None
    emergency_contact_name: Optional[str] = Field(None, alias="emergencyContactName")
    emergency_contact_phone: Optional[str] = Field(None, alias="emergencyContactPhone")
    emergency_contact_relation: Optional[str] = Field(
        None, alias="emergencyContactRelation"
    )
    dependents_info: Optional[str] = Field(None, alias="dependentsInfo")
    bank_info: Optional[str] = Field(None, alias="bankInfo")
    compensation_info: Optional[str] = Field(None, alias="compensationInfo")
    system_access_levels: Optional[str] = Field(None, alias="systemAccessLevels")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class ExecutiveCreate(ExecutiveBase):
    pass


class ExecutiveUpdate(ExecutiveBase):
    full_name: Optional[str] = Field(None, alias="fullName")
    work_email: Optional[EmailStr] = Field(None, alias="workEmail")


class Executive(ExecutiveBase):
    id: int
