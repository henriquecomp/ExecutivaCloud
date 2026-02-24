from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import date

class SecretaryBase(BaseModel):
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
    work_email: Optional[EmailStr] = Field(None, alias="workEmail")
    work_phone: Optional[str] = Field(None, alias="workPhone")
    extension: Optional[str] = None
    personal_email: Optional[EmailStr] = Field(None, alias="personalEmail")
    personal_phone: Optional[str] = Field(None, alias="personalPhone")
    address: Optional[str] = None
    linkedin_profile_url: Optional[str] = Field(None, alias="linkedinProfileUrl")
    job_title: Optional[str] = Field(None, alias="jobTitle")
    organization_id: Optional[int] = Field(None, alias="organizationId")
    department_id: Optional[int] = Field(None, alias="departmentId")
    cost_center: Optional[str] = Field(None, alias="costCenter")
    employee_id: Optional[str] = Field(None, alias="employeeId")
    reports_to_executive_id: Optional[int] = Field(None, alias="reportsToExecutiveId")
    hire_date: Optional[date] = Field(None, alias="hireDate")
    work_location: Optional[str] = Field(None, alias="workLocation")
    system_access_levels: Optional[str] = Field(None, alias="systemAccessLevels")
    photo_url: Optional[str] = Field(None, alias="photoUrl")
    bio: Optional[str] = None
    education: Optional[str] = None
    languages: Optional[str] = None
    emergency_contact_name: Optional[str] = Field(None, alias="emergencyContactName")
    emergency_contact_phone: Optional[str] = Field(None, alias="emergencyContactPhone")
    emergency_contact_relation: Optional[str] = Field(None, alias="emergencyContactRelation")
    dependents_info: Optional[str] = Field(None, alias="dependentsInfo")
    bank_info: Optional[str] = Field(None, alias="bankInfo")
    compensation_info: Optional[str] = Field(None, alias="compensationInfo")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class SecretaryCreate(SecretaryBase):
    executive_ids: List[int] = Field(default=[], alias="executiveIds")

class SecretaryUpdate(SecretaryBase):
    full_name: Optional[str] = Field(None, alias="fullName")
    executive_ids: Optional[List[int]] = Field(None, alias="executiveIds")

class Secretary(SecretaryBase):
    id: int
    executive_ids: List[int] = Field(default=[], alias="executiveIds")

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        # Transforma o relacionamento do SQLAlchemy em uma lista de inteiros (ids) para o JSON
        if hasattr(obj, "executives"):
            obj.executive_ids = [exec.id for exec in obj.executives]
        return super().model_validate(obj, *args, **kwargs)