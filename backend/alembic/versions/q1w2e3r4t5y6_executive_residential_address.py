"""executive residential address fields

Revision ID: q1w2e3r4t5y6
Revises: p7q8r9s0t1u2
Create Date: 2026-08-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "q1w2e3r4t5y6"
down_revision: Union[str, None] = "p7q8r9s0t1u2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("executives") as batch_op:
        batch_op.add_column(sa.Column("zip_code", sa.String(length=9), nullable=True))
        batch_op.add_column(sa.Column("number", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("neighborhood", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("city", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("state", sa.String(length=2), nullable=True))
        batch_op.add_column(sa.Column("complement", sa.String(length=100), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("executives") as batch_op:
        batch_op.drop_column("complement")
        batch_op.drop_column("state")
        batch_op.drop_column("city")
        batch_op.drop_column("neighborhood")
        batch_op.drop_column("number")
        batch_op.drop_column("zip_code")
