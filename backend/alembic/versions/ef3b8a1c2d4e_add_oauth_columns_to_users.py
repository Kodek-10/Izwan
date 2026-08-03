"""add oauth_provider and oauth_id columns to users

Revision ID: ef3b8a1c2d4e
Revises: c1e8a2f4b3d5
Create Date: 2026-08-03 10:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "ef3b8a1c2d4e"
down_revision: Union[str, Sequence[str], None] = "c1e8a2f4b3d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("oauth_provider", sa.String(), nullable=True))
    op.add_column("users", sa.Column("oauth_id", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "oauth_id")
    op.drop_column("users", "oauth_provider")
