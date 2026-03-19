"""add_documents_and_document_categories

Revision ID: c4d2a8be7d11
Revises: 6f9f3f0b9d2a
Create Date: 2026-03-17 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c4d2a8be7d11"
down_revision: Union[str, Sequence[str], None] = "6f9f3f0b9d2a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "document_categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("document_categories", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_document_categories_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_document_categories_name"), ["name"], unique=True)

    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=True),
        sa.Column("executive_id", sa.Integer(), nullable=False),
        sa.Column("upload_date", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["document_categories.id"]),
        sa.ForeignKeyConstraint(["executive_id"], ["executives.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("documents", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_documents_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_documents_name"), ["name"], unique=False)
        batch_op.create_index(batch_op.f("ix_documents_executive_id"), ["executive_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_documents_upload_date"), ["upload_date"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("documents", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_documents_upload_date"))
        batch_op.drop_index(batch_op.f("ix_documents_executive_id"))
        batch_op.drop_index(batch_op.f("ix_documents_name"))
        batch_op.drop_index(batch_op.f("ix_documents_id"))
    op.drop_table("documents")

    with op.batch_alter_table("document_categories", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_document_categories_name"))
        batch_op.drop_index(batch_op.f("ix_document_categories_id"))
    op.drop_table("document_categories")
