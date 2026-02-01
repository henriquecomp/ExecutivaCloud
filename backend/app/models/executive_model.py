from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Executive(Base):
    __tablename__ = "executives"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False, index=True)  # fullName

    # --- Bloco 1: Identificação Pessoal ---
    cpf = Column(String, unique=True, index=True, nullable=True)
    rg = Column(String, nullable=True)
    rg_issuer = Column(String, nullable=True)  # rgIssuer
    rg_issue_date = Column(Date, nullable=True)  # rgIssueDate
    birth_date = Column(Date, nullable=True)  # birthDate
    nationality = Column(String, nullable=True)
    place_of_birth = Column(String, nullable=True)  # placeOfBirth
    mother_name = Column(String, nullable=True)  # motherName
    father_name = Column(String, nullable=True)  # fatherName
    civil_status = Column(String, nullable=True)  # civilStatus

    # --- Bloco 2: Informações de Contato ---
    work_email = Column(String, index=True, nullable=True)  # workEmail
    work_phone = Column(String, nullable=True)  # workPhone
    extension = Column(String, nullable=True)
    personal_email = Column(String, nullable=True)  # personalEmail
    personal_phone = Column(String, nullable=True)  # personalPhone
    address = Column(String, nullable=True)
    linkedin_profile_url = Column(String, nullable=True)  # linkedinProfileUrl

    # --- Bloco 3: Dados Profissionais e Corporativos ---
    job_title = Column(String, nullable=True)  # jobTitle
    cost_center = Column(String, nullable=True)  # costCenter
    employee_id = Column(String, nullable=True)  # employeeId
    hire_date = Column(Date, nullable=True)  # hireDate
    work_location = Column(String, nullable=True)  # workLocation

    # Chaves Estrangeiras
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    reports_to_executive_id = Column(
        Integer, ForeignKey("executives.id"), nullable=True
    )

    # --- Bloco 4: Perfil Público ---
    photo_url = Column(String, nullable=True)  # photoUrl
    bio = Column(Text, nullable=True)  # Tipo Text para descrições longas
    education = Column(Text, nullable=True)
    languages = Column(String, nullable=True)

    # --- Bloco 5: Dados de Emergência e Dependentes ---
    emergency_contact_name = Column(String, nullable=True)  # emergencyContactName
    emergency_contact_phone = Column(String, nullable=True)  # emergencyContactPhone
    emergency_contact_relation = Column(
        String, nullable=True
    )  # emergencyContactRelation
    dependents_info = Column(
        Text, nullable=True
    )  # dependentsInfo (pode ser JSON string)

    # --- Bloco 6: Dados Financeiros e de Acesso ---
    bank_info = Column(Text, nullable=True)  # bankInfo
    compensation_info = Column(Text, nullable=True)  # compensationInfo
    system_access_levels = Column(String, nullable=True)  # systemAccessLevels

    # --- Relacionamentos ---
    organization = relationship("Organization", back_populates="executives")
    # Certifique-se de adicionar 'executives = relationship(...)' no model Department se quiser bidirecionalidade
    department = relationship("Department")
    # Relacionamento de auto-referência (Chefe/Subordinado)
    manager = relationship("Executive", remote_side=[id], backref="subordinates")
