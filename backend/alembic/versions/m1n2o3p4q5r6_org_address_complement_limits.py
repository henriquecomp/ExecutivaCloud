"""org address complement and varchar limits

Revision ID: m1n2o3p4q5r6
Revises: l2m3n4o5p6q7
Create Date: 2026-05-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "m1n2o3p4q5r6"
down_revision: Union[str, None] = "l2m3n4o5p6q7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TEXT_100_COLS_LEGAL = ("name", "street", "number", "neighborhood", "city", "complement")
TEXT_100_COLS_ORG = ("name", "street", "number", "neighborhood", "city", "complement")


def _alter_to_string100(table: str, column: str) -> None:
    with op.batch_alter_table(table) as batch_op:
        batch_op.alter_column(
            column,
            existing_type=sa.String(),
            type_=sa.String(length=100),
            existing_nullable=True,
        )


def upgrade() -> None:
    with op.batch_alter_table("legal_organizations") as batch_op:
        batch_op.add_column(sa.Column("complement", sa.String(length=100), nullable=True))

    with op.batch_alter_table("organizations") as batch_op:
        batch_op.add_column(sa.Column("complement", sa.String(length=100), nullable=True))

    for col in TEXT_100_COLS_LEGAL:
        _alter_to_string100("legal_organizations", col)
    for col in TEXT_100_COLS_ORG:
        _alter_to_string100("organizations", col)

    with op.batch_alter_table("executives") as batch_op:
        batch_op.alter_column(
            "street",
            existing_type=sa.Text(),
            type_=sa.String(length=100),
            existing_nullable=True,
        )


def downgrade() -> None:
    with op.batch_alter_table("executives") as batch_op:
        batch_op.alter_column(
            "street",
            existing_type=sa.String(length=100),
            type_=sa.Text(),
            existing_nullable=True,
        )

    for col in reversed(TEXT_100_COLS_ORG):
        with op.batch_alter_table("organizations") as batch_op:
            batch_op.alter_column(
                column,
                existing_type=sa.String(length=100),
                type_=sa.String(),
                existing_nullable=True,
            )
    for col in reversed(TEXT_100_COLS_LEGAL):
        with op.batch_alter_table("legal_organizations") as batch_op:
            batch_op.alter_column(
                column,
                existing_type=sa.String(length=100),
                type_=sa.String(),
                existing_nullable=True,
            )

    with op.batch_alter_table("organizations") as batch_op:
        batch_op.drop_column("complement")
    with op.batch_alter_table("legal_organizations") as batch_op:
        batch_op.drop_column("complement")
