"""add secretaries and secretary_executives

Revision ID: h3i4j5k6l7m8
Revises: g2h4i5j6k7l8
Create Date: 2026-03-31

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "h3i4j5k6l7m8"
down_revision: Union[str, None] = "g2h4i5j6k7l8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "secretaries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=True),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("work_email", sa.String(), nullable=True),
        sa.Column("job_title", sa.String(), nullable=True),
        sa.Column("profile_json", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_secretaries_id"), "secretaries", ["id"], unique=False)
    op.create_index(op.f("ix_secretaries_work_email"), "secretaries", ["work_email"], unique=False)

    op.create_table(
        "secretary_executives",
        sa.Column("secretary_id", sa.Integer(), nullable=False),
        sa.Column("executive_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["executive_id"], ["executives.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["secretary_id"], ["secretaries.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("secretary_id", "executive_id"),
    )


def downgrade() -> None:
    op.drop_table("secretary_executives")
    op.drop_index(op.f("ix_secretaries_work_email"), table_name="secretaries")
    op.drop_index(op.f("ix_secretaries_id"), table_name="secretaries")
    op.drop_table("secretaries")
