from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    image_url = Column(Text, nullable=False)
    category_id = Column(Integer, ForeignKey("document_categories.id"), nullable=True)
    executive_id = Column(Integer, ForeignKey("executives.id"), nullable=False, index=True)
    upload_date = Column(DateTime, nullable=False, index=True)

    category = relationship("DocumentCategory", back_populates="documents")
    executive = relationship("Executive")
