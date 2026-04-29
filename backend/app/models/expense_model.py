from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey, Numeric
from sqlalchemy.orm import relationship

from app.core.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    executive_id = Column(Integer, ForeignKey("executives.id"), nullable=False, index=True)
    expense_category_id = Column(
        Integer,
        ForeignKey("expense_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    description = Column(String, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    expense_date = Column(Date, nullable=False, index=True)
    entry_type = Column(String, nullable=False)  # "A pagar" | "A receber" (JSON alias: type)
    entity_type = Column(String, nullable=False)  # Pessoa Física | Pessoa Jurídica
    status = Column(String, nullable=False)
    receipt_url = Column(Text, nullable=True)

    executive = relationship("Executive")
    category = relationship("ExpenseCategory", back_populates="expenses")
