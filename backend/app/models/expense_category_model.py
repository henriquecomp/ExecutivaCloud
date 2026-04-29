from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class ExpenseCategory(Base):
    __tablename__ = "expense_categories"
    __table_args__ = (UniqueConstraint("executive_id", "name", name="uq_expense_category_exec_name"),)

    id = Column(Integer, primary_key=True, index=True)
    executive_id = Column(Integer, ForeignKey("executives.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    color = Column(String, nullable=False, default="#64748b")

    executive = relationship("Executive")
    expenses = relationship("Expense", back_populates="category")
