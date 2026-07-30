"""add email and display_name columns to users

Revision ID: c1e8a2f4b3d5
Revises: a2c1f59e7d33
Create Date: 2026-07-30 15:30:00.000000

Le modèle User déclare email comme nullable=False mais la colonne est
ajoutée nullable ici pour ne pas casser les lignes existantes en prod.
Un backfill manuel ou une migration ultérieure pourra appliquer NOT NULL
quand tous les utilisateurs auront un email.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c1e8a2f4b3d5"
down_revision: Union[str, Sequence[str], None] = "a2c1f59e7d33"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email", sa.String(), nullable=True))
    op.add_column("users", sa.Column("display_name", sa.String(), nullable=True))
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_column("users", "email")
    op.drop_column("users", "display_name")
