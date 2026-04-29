"""add color to document categories

Revision ID: l2m3n4o5p6q7
Revises: k9l0m1n2o3p4
Create Date: 2026-04-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "l2m3n4o5p6q7"
down_revision: Union[str, None] = "k9l0m1n2o3p4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("document_categories") as batch:
        batch.add_column(
            sa.Column(
                "color",
                sa.String(length=16),
                nullable=False,
                server_default="#64748b",
            ),
        )


def downgrade() -> None:
    with op.batch_alter_table("document_categories") as batch:
        batch.drop_column("color")
