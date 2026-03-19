"""add_contacts_and_contact_types

Revision ID: a9b3c1d4e8f2
Revises: c4d2a8be7d11
Create Date: 2026-03-17 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a9b3c1d4e8f2"
down_revision: Union[str, Sequence[str], None] = "c4d2a8be7d11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "contact_types",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("contact_types", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_contact_types_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_contact_types_name"), ["name"], unique=True)

    op.create_table(
        "contacts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("company", sa.String(), nullable=True),
        sa.Column("role", sa.String(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("contact_type_id", sa.Integer(), nullable=True),
        sa.Column("executive_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["contact_type_id"], ["contact_types.id"]),
        sa.ForeignKeyConstraint(["executive_id"], ["executives.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("contacts", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_contacts_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_contacts_full_name"), ["full_name"], unique=False)
        batch_op.create_index(batch_op.f("ix_contacts_executive_id"), ["executive_id"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("contacts", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_contacts_executive_id"))
        batch_op.drop_index(batch_op.f("ix_contacts_full_name"))
        batch_op.drop_index(batch_op.f("ix_contacts_id"))
    op.drop_table("contacts")

    with op.batch_alter_table("contact_types", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_contact_types_name"))
        batch_op.drop_index(batch_op.f("ix_contact_types_id"))
    op.drop_table("contact_types")
