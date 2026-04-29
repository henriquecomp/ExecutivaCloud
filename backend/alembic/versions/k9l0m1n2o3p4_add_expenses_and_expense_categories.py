"""add expenses and expense categories

Revision ID: k9l0m1n2o3p4
Revises: i4j5k6l7m8n9
Create Date: 2026-04-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "k9l0m1n2o3p4"
down_revision: Union[str, None] = "i4j5k6l7m8n9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "expense_categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("executive_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("color", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["executive_id"], ["executives.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("executive_id", "name", name="uq_expense_category_exec_name"),
    )
    with op.batch_alter_table("expense_categories", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_expense_categories_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_expense_categories_executive_id"), ["executive_id"], unique=False)

    op.create_table(
        "expenses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("executive_id", sa.Integer(), nullable=False),
        sa.Column("expense_category_id", sa.Integer(), nullable=True),
        sa.Column("description", sa.String(), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("expense_date", sa.Date(), nullable=False),
        sa.Column("entry_type", sa.String(), nullable=False),
        sa.Column("entity_type", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("receipt_url", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["executive_id"], ["executives.id"]),
        sa.ForeignKeyConstraint(["expense_category_id"], ["expense_categories.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("expenses", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_expenses_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_expenses_executive_id"), ["executive_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_expenses_expense_category_id"), ["expense_category_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_expenses_expense_date"), ["expense_date"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("expenses", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_expenses_expense_date"))
        batch_op.drop_index(batch_op.f("ix_expenses_expense_category_id"))
        batch_op.drop_index(batch_op.f("ix_expenses_executive_id"))
        batch_op.drop_index(batch_op.f("ix_expenses_id"))
    op.drop_table("expenses")

    with op.batch_alter_table("expense_categories", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_expense_categories_executive_id"))
        batch_op.drop_index(batch_op.f("ix_expense_categories_id"))
    op.drop_table("expense_categories")
