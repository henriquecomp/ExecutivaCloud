"""add user roles and scope fk

Revision ID: g2h4i5j6k7l8
Revises: f1a8b9c7d2e3
Create Date: 2026-03-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "g2h4i5j6k7l8"
down_revision: Union[str, None] = "f1a8b9c7d2e3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.add_column(
            sa.Column(
                "role",
                sa.String(length=40),
                nullable=False,
                server_default="admin_company",
            )
        )
        batch.add_column(sa.Column("legal_organization_id", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("organization_id", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("executive_id", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("secretary_external_id", sa.String(length=64), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.drop_column("secretary_external_id")
        batch.drop_column("executive_id")
        batch.drop_column("organization_id")
        batch.drop_column("legal_organization_id")
        batch.drop_column("role")
