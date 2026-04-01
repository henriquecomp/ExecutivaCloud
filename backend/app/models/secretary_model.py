from sqlalchemy import Column, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import relationship

from app.core.database import Base

secretary_executives = Table(
    "secretary_executives",
    Base.metadata,
    Column(
        "secretary_id",
        Integer,
        ForeignKey("secretaries.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "executive_id",
        Integer,
        ForeignKey("executives.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Secretary(Base):
    __tablename__ = "secretaries"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    full_name = Column(String, nullable=False)
    work_email = Column(String, nullable=True, index=True)
    job_title = Column(String, nullable=True)
    profile_json = Column(Text, nullable=True)

    # Sem relationship com Organization: evita ciclos de import/registry no SQLAlchemy; usa-se só organization_id.
    executives = relationship(
        "Executive",
        secondary=secretary_executives,
        back_populates="secretaries",
    )
