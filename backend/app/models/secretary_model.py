from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.core.database import Base

# Tabela associativa Many-to-Many entre Secretárias e Executivos
secretary_executive_association = Table(
    "secretary_executive",
    Base.metadata,
    Column("secretary_id", Integer, ForeignKey("secretaries.id"), primary_key=True),
    Column("executive_id", Integer, ForeignKey("executives.id"), primary_key=True)
)

class Secretary(Base):
    __tablename__ = "secretaries"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    cpf = Column(String, unique=True, index=True, nullable=True)
    rg = Column(String, nullable=True)
    rg_issuer = Column(String, nullable=True)
    rg_issue_date = Column(Date, nullable=True)
    birth_date = Column(Date, nullable=True)
    nationality = Column(String, nullable=True)
    place_of_birth = Column(String, nullable=True)
    mother_name = Column(String, nullable=True)
    father_name = Column(String, nullable=True)
    civil_status = Column(String, nullable=True)
    work_email = Column(String, nullable=True)
    work_phone = Column(String, nullable=True)
    extension = Column(String, nullable=True)
    personal_email = Column(String, nullable=True)
    personal_phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    linkedin_profile_url = Column(String, nullable=True)
    job_title = Column(String, nullable=True)
    
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    cost_center = Column(String, nullable=True)
    employee_id = Column(String, nullable=True)
    reports_to_executive_id = Column(Integer, ForeignKey("executives.id"), nullable=True)
    
    hire_date = Column(Date, nullable=True)
    work_location = Column(String, nullable=True)
    system_access_levels = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    education = Column(Text, nullable=True)
    languages = Column(String, nullable=True)
    
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    emergency_contact_relation = Column(String, nullable=True)
    dependents_info = Column(Text, nullable=True)
    bank_info = Column(Text, nullable=True)
    compensation_info = Column(Text, nullable=True)

    # Relacionamento com Executivos
    executives = relationship("Executive", secondary=secretary_executive_association, back_populates="secretaries")