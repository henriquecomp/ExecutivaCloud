"""add_color_to_contact_types

Revision ID: b3f1c7e92a10
Revises: a9b3c1d4e8f2
Create Date: 2026-03-17 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b3f1c7e92a10"
down_revision: Union[str, Sequence[str], None] = "a9b3c1d4e8f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("contact_types", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("color", sa.String(length=7), nullable=False, server_default="#64748b")
        )


def downgrade() -> None:
    with op.batch_alter_table("contact_types", schema=None) as batch_op:
        batch_op.drop_column("color")
