from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class ContactType(Base):
    __tablename__ = "contact_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    color = Column(String(length=7), nullable=False, default="#64748b")

    contacts = relationship("Contact", back_populates="contact_type")
