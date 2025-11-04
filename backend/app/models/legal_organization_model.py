from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class LegalOrganization(Base):
    __tablename__ = "legal_organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    cnpj = Column(String, unique=True, index=True, nullable=True)
    street = Column(String, nullable=True)
    number = Column(String, nullable=True)
    neighborhood = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String(2), nullable=True) # Geralmente 2 para UF
    zipCode = Column(String, nullable=True)
    
    # Relacionamento: 1-para-N com Organization (Empresas/Filiais)
    organizations = relationship("Organization", back_populates="legal_organization")