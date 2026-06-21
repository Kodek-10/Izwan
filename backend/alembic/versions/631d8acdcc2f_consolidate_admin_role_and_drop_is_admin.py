"""consolidate admin role and drop is_admin

Revision ID: 631d8acdcc2f
Revises: 076a73afeaad
Create Date: 2026-06-21 19:48:54.688120

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '631d8acdcc2f'
down_revision: Union[str, Sequence[str], None] = '076a73afeaad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Consolide la gestion admin sur la colonne `role` et supprime `is_admin`.

    Écrit de façon défensive car la base de production a dérivé (les colonnes
    `role` et `is_admin` y ont été ajoutées à la main, hors Alembic) : la
    migration doit fonctionner aussi bien sur cette base que sur une base
    reconstruite depuis le baseline.
    """
    bind = op.get_bind()
    columns = {col["name"] for col in sa.inspect(bind).get_columns("users")}

    # 1. Garantir la présence de `role` (déjà là en prod ; créée sur une base neuve).
    if "role" not in columns:
        op.add_column(
            "users",
            sa.Column("role", sa.String(), nullable=False, server_default="USER"),
        )

    # 2. Reporter l'ancien drapeau `is_admin` vers le nouveau rôle, puis le supprimer.
    if "is_admin" in columns:
        op.execute("UPDATE users SET role = 'ADMIN' WHERE is_admin = true")
        op.drop_column("users", "is_admin")


def downgrade() -> None:
    """Restaure `is_admin` à partir de `role` (downgrade pragmatique).

    On conserve `role` (qui préexistait à cette migration en production) ; on se
    contente de reconstituer `is_admin` pour revenir à l'ancien comportement.
    """
    bind = op.get_bind()
    columns = {col["name"] for col in sa.inspect(bind).get_columns("users")}

    if "is_admin" not in columns:
        op.add_column(
            "users",
            sa.Column(
                "is_admin",
                sa.Boolean(),
                nullable=True,
                server_default=sa.text("false"),
            ),
        )
    op.execute("UPDATE users SET is_admin = (role = 'ADMIN')")
