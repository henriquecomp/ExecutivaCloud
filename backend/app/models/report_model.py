from datetime import datetime

from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, JSON

from app.core.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    selected_executive_ids = Column(JSON, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    include_events = Column(Boolean, nullable=False, default=True)
    include_expenses = Column(Boolean, nullable=False, default=True)
    include_tasks = Column(Boolean, nullable=False, default=True)
    include_contacts = Column(Boolean, nullable=False, default=True)
    total_records = Column(Integer, nullable=False, default=0)
    generated_data = Column(JSON, nullable=False, default=list)
    generated_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
