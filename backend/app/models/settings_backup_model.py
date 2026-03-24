from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, JSON

from app.core.database import Base


class SettingsBackup(Base):
    __tablename__ = "settings_backups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    version = Column(String, nullable=False)
    data = Column(JSON, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
