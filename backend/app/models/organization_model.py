from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)

    # Chave estrangeira para legal_organizations
    legalOrganizationId = Column(
        Integer, ForeignKey("legal_organizations.id"), nullable=False
    )

    cnpj = Column(String(14), unique=True, index=True, nullable=True)
    street = Column(String(100), nullable=True)
    number = Column(String(100), nullable=True)
    neighborhood = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    complement = Column(String(100), nullable=True)
    state = Column(String(2), nullable=True)
    zipCode = Column(String(8), nullable=True)

    # Relacionamentos
    legal_organization = relationship(
        "LegalOrganization", back_populates="organizations"
    )
    departments = relationship("Department", back_populates="organization")
    executives = relationship("Executive", back_populates="organization")
