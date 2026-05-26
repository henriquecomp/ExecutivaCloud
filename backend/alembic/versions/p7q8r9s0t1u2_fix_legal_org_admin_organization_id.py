"""clear organization_id for legal org admins

Revision ID: p7q8r9s0t1u2
Revises: m1n2o3p4q5r6
Create Date: 2026-05-20

"""
from typing import Sequence, Union

from alembic import op


revision: str = "p7q8r9s0t1u2"
down_revision: Union[str, None] = "m1n2o3p4q5r6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE users
        SET organization_id = NULL
        WHERE role = 'admin_legal_organization'
          AND organization_id IS NOT NULL
        """
    )


def downgrade() -> None:
    pass
