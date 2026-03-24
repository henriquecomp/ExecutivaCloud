from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    due_date = Column(Date, nullable=False, index=True)
    priority = Column(String, nullable=False)
    status = Column(String, nullable=False)
    executive_id = Column(Integer, ForeignKey("executives.id"), nullable=False, index=True)
    recurrence_id = Column(String, nullable=True, index=True)
    recurrence = Column(JSON, nullable=True)

    executive = relationship("Executive")
