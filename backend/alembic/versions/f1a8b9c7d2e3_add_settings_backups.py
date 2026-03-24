"""add_settings_backups

Revision ID: f1a8b9c7d2e3
Revises: e8f3a4b1c2d9
Create Date: 2026-03-17 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f1a8b9c7d2e3"
down_revision: Union[str, Sequence[str], None] = "e8f3a4b1c2d9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "settings_backups",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("version", sa.String(), nullable=False),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("settings_backups", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_settings_backups_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_settings_backups_name"), ["name"], unique=False)
        batch_op.create_index(batch_op.f("ix_settings_backups_created_at"), ["created_at"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("settings_backups", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_settings_backups_created_at"))
        batch_op.drop_index(batch_op.f("ix_settings_backups_name"))
        batch_op.drop_index(batch_op.f("ix_settings_backups_id"))
    op.drop_table("settings_backups")
