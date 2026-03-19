"""add_events_and_event_types

Revision ID: 6f9f3f0b9d2a
Revises: 2c8956da521b
Create Date: 2026-03-17 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "6f9f3f0b9d2a"
down_revision: Union[str, Sequence[str], None] = "2c8956da521b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "event_types",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("color", sa.String(length=7), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("event_types", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_event_types_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_event_types_name"), ["name"], unique=True)

    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("start_time", sa.DateTime(), nullable=False),
        sa.Column("end_time", sa.DateTime(), nullable=False),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("event_type_id", sa.Integer(), nullable=True),
        sa.Column("executive_id", sa.Integer(), nullable=False),
        sa.Column("reminder_minutes", sa.Integer(), nullable=True),
        sa.Column("recurrence_id", sa.String(), nullable=True),
        sa.Column("recurrence", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["event_type_id"], ["event_types.id"]),
        sa.ForeignKeyConstraint(["executive_id"], ["executives.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("events", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_events_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_events_title"), ["title"], unique=False)
        batch_op.create_index(batch_op.f("ix_events_start_time"), ["start_time"], unique=False)
        batch_op.create_index(batch_op.f("ix_events_executive_id"), ["executive_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_events_recurrence_id"), ["recurrence_id"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("events", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_events_recurrence_id"))
        batch_op.drop_index(batch_op.f("ix_events_executive_id"))
        batch_op.drop_index(batch_op.f("ix_events_start_time"))
        batch_op.drop_index(batch_op.f("ix_events_title"))
        batch_op.drop_index(batch_op.f("ix_events_id"))
    op.drop_table("events")

    with op.batch_alter_table("event_types", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_event_types_name"))
        batch_op.drop_index(batch_op.f("ix_event_types_id"))
    op.drop_table("event_types")
