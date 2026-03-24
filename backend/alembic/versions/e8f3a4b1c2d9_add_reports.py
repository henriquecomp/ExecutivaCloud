"""add_reports

Revision ID: e8f3a4b1c2d9
Revises: d7e4a1c9b2f0
Create Date: 2026-03-17 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e8f3a4b1c2d9"
down_revision: Union[str, Sequence[str], None] = "d7e4a1c9b2f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "reports",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("selected_executive_ids", sa.JSON(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("include_events", sa.Boolean(), nullable=False),
        sa.Column("include_expenses", sa.Boolean(), nullable=False),
        sa.Column("include_tasks", sa.Boolean(), nullable=False),
        sa.Column("include_contacts", sa.Boolean(), nullable=False),
        sa.Column("total_records", sa.Integer(), nullable=False),
        sa.Column("generated_data", sa.JSON(), nullable=False),
        sa.Column("generated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("reports", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_reports_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_reports_name"), ["name"], unique=False)
        batch_op.create_index(batch_op.f("ix_reports_generated_at"), ["generated_at"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("reports", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_reports_generated_at"))
        batch_op.drop_index(batch_op.f("ix_reports_name"))
        batch_op.drop_index(batch_op.f("ix_reports_id"))
    op.drop_table("reports")
