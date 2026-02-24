from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)

    # Chave estrangeira para legal_organizations (Matriz)
    legalOrganizationId = Column(
        Integer, ForeignKey("legal_organizations.id"), nullable=False
    )

    cnpj = Column(String, unique=True, index=True, nullable=True)
    street = Column(String, nullable=True)
    number = Column(String, nullable=True)
    neighborhood = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String(2), nullable=True)
    zipCode = Column(String, nullable=True)

    # Relacionamentos
    legal_organization = relationship(
        "LegalOrganization", back_populates="organizations"
    )
    departments = relationship("Department", back_populates="organization")
    executives = relationship("Executive", back_populates="organization")