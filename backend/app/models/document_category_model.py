from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class DocumentCategory(Base):
    __tablename__ = "document_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    color = Column(String(16), nullable=False, default="#64748b")

    documents = relationship("Document", back_populates="category")
