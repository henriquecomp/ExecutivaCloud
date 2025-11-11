from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    
    organizationId = Column(Integer, ForeignKey("organizations.id"), nullable=False)

    # Relacionamento
    organization = relationship("Organization", back_populates="departments")
    # Adicione aqui o relacionamento com Executivos
    # executives = relationship("Executive", back_populates="department")
    
    # Garantir que o nome do departamento seja único *dentro* da mesma organização
    __table_args__ = (UniqueConstraint('name', 'organizationId', name='_name_organization_uc'),)