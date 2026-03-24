"""add_tasks

Revision ID: d7e4a1c9b2f0
Revises: b3f1c7e92a10
Create Date: 2026-03-17 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d7e4a1c9b2f0"
down_revision: Union[str, Sequence[str], None] = "b3f1c7e92a10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("priority", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("executive_id", sa.Integer(), nullable=False),
        sa.Column("recurrence_id", sa.String(), nullable=True),
        sa.Column("recurrence", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["executive_id"], ["executives.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("tasks", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_tasks_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_tasks_title"), ["title"], unique=False)
        batch_op.create_index(batch_op.f("ix_tasks_due_date"), ["due_date"], unique=False)
        batch_op.create_index(batch_op.f("ix_tasks_executive_id"), ["executive_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_tasks_recurrence_id"), ["recurrence_id"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("tasks", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_tasks_recurrence_id"))
        batch_op.drop_index(batch_op.f("ix_tasks_executive_id"))
        batch_op.drop_index(batch_op.f("ix_tasks_due_date"))
        batch_op.drop_index(batch_op.f("ix_tasks_title"))
        batch_op.drop_index(batch_op.f("ix_tasks_id"))
    op.drop_table("tasks")
