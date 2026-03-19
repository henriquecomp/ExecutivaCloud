from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False, index=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    company = Column(String, nullable=True)
    role = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    contact_type_id = Column(Integer, ForeignKey("contact_types.id"), nullable=True)
    executive_id = Column(Integer, ForeignKey("executives.id"), nullable=False, index=True)

    contact_type = relationship("ContactType", back_populates="contacts")
    executive = relationship("Executive")
