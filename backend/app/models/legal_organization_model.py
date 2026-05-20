from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class LegalOrganization(Base):
    __tablename__ = "legal_organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    cnpj = Column(String(14), unique=True, index=True, nullable=True)
    street = Column(String(100), nullable=True)
    number = Column(String(100), nullable=True)
    neighborhood = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    complement = Column(String(100), nullable=True)
    state = Column(String(2), nullable=True)
    zipCode = Column(String(8), nullable=True)
    
    # Relacionamento: 1-para-N com Organization (Empresas/Filiais)
    organizations = relationship("Organization", back_populates="legal_organization")