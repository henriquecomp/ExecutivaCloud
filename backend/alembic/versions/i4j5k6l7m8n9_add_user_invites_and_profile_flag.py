"""add user invite tokens and needs_profile_completion

Revision ID: i4j5k6l7m8n9
Revises: h3i4j5k6l7m8
Create Date: 2026-04-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "i4j5k6l7m8n9"
down_revision: Union[str, None] = "h3i4j5k6l7m8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_invite_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_invite_tokens_token_hash"), "user_invite_tokens", ["token_hash"], unique=True)
    op.create_index(op.f("ix_user_invite_tokens_user_id"), "user_invite_tokens", ["user_id"], unique=False)

    with op.batch_alter_table("users") as batch:
        batch.add_column(
            sa.Column(
                "needs_profile_completion",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("0"),
            )
        )


def downgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.drop_column("needs_profile_completion")

    op.drop_index(op.f("ix_user_invite_tokens_user_id"), table_name="user_invite_tokens")
    op.drop_index(op.f("ix_user_invite_tokens_token_hash"), table_name="user_invite_tokens")
    op.drop_table("user_invite_tokens")
