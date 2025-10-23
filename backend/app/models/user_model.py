from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base

class Usuario(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True) 
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, index=True, nullable=True) 
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
