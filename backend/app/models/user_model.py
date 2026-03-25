from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Usuario(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    # master | admin_legal_organization | admin_company | executive | secretary
    role = Column(String(40), nullable=False, default="admin_company")

    legal_organization_id = Column(Integer, ForeignKey("legal_organizations.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    executive_id = Column(Integer, ForeignKey("executives.id"), nullable=True)
    secretary_external_id = Column(String(64), nullable=True)

    legal_organization = relationship("LegalOrganization", foreign_keys=[legal_organization_id])
    organization = relationship("Organization", foreign_keys=[organization_id])
    executive = relationship("Executive", foreign_keys=[executive_id])
