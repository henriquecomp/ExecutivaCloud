from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import date


# Base com todos os campos opcionais e alias para camelCase
class ExecutiveBase(BaseModel):
    fullName: str = Field(..., min_length=2, max_length=255)

    # Bloco 1
    cpf: Optional[str] = None
    rg: Optional[str] = None
    rgIssuer: Optional[str] = None
    rgIssueDate: Optional[date] = None
    birthDate: Optional[date] = None
    nationality: Optional[str] = None
    placeOfBirth: Optional[str] = None
    motherName: Optional[str] = None
    fatherName: Optional[str] = None
    civilStatus: Optional[str] = None

    # Bloco 2
    workEmail: Optional[EmailStr] = None
    workPhone: Optional[str] = None
    extension: Optional[str] = None
    personalEmail: Optional[EmailStr] = None
    personalPhone: Optional[str] = None
    address: Optional[str] = None
    linkedinProfileUrl: Optional[str] = None

    # Bloco 3
    jobTitle: Optional[str] = None
    organizationId: Optional[int] = None  # Backend usa Int
    departmentId: Optional[int] = None  # Backend usa Int
    costCenter: Optional[str] = None
    employeeId: Optional[str] = None
    reportsToExecutiveId: Optional[int] = None
    hireDate: Optional[date] = None
    workLocation: Optional[str] = None

    # Bloco 4
    photoUrl: Optional[str] = None
    bio: Optional[str] = None
    education: Optional[str] = None
    languages: Optional[str] = None

    # Bloco 5
    emergencyContactName: Optional[str] = None
    emergencyContactPhone: Optional[str] = None
    emergencyContactRelation: Optional[str] = None
    dependentsInfo: Optional[str] = None

    # Bloco 6
    bankInfo: Optional[str] = None
    compensationInfo: Optional[str] = None
    systemAccessLevels: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


# Input Criação
class ExecutiveCreate(ExecutiveBase):
    pass


# Input Atualização
class ExecutiveUpdate(ExecutiveBase):
    # No update, até o nome pode ser opcional se desejar lógica de patch,
    # mas herdando de Base, fullName é obrigatório.
    # Se quiser tudo opcional, redeclare fullName como Optional.
    fullName: Optional[str] = Field(None, min_length=2, max_length=255)


# Output
class Executive(ExecutiveBase):
    id: int  # Mantemos int para alinhar com o DB, o frontend deve tratar a conversão se necessário

    class Config:
        from_attributes = True
