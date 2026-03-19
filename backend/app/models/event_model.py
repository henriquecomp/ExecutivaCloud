from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)
    location = Column(String, nullable=True)
    event_type_id = Column(Integer, ForeignKey("event_types.id"), nullable=True)
    executive_id = Column(Integer, ForeignKey("executives.id"), nullable=False, index=True)
    reminder_minutes = Column(Integer, nullable=True)
    recurrence_id = Column(String, nullable=True, index=True)
    recurrence = Column(JSON, nullable=True)

    event_type = relationship("EventType", back_populates="events")
    executive = relationship("Executive")
