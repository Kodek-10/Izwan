"""token revocation (ver claim) and SET NULL on snippet collection fk

Revision ID: a2c1f59e7d33
Revises: da4cc3ded511
Create Date: 2026-07-14 00:00:00.000000

H4 / CWE-613 : ajoute users.token_version. Le token JWT porte le n° de version
dans le claim `ver` ; get_current_user le compare à la valeur DB. Incrémenter la
version (ex: changement de mot de passe) révoque immédiatement tous les tokens
existants (y compris un token volé).

L2 : recrée la FK snippets.collection_id avec ondelete=SET NULL (Postgres
uniquement — sur SQLite la FK n'a pas de nom; `create_all` rebuild le bon
schéma pour les tests/fresh deploys). L'endpoint delete_collection nullifie déjà
avant suppression, ce recreatement est de la défense-en-profondeur au niveau
schéma pour toute autre voie de suppression (admin, SQL direct).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a2c1f59e7d33'
down_revision: Union[str, Sequence[str], None] = 'da4cc3ded511'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _set_null_fk(up: bool) -> None:
    """Recrée la FK snippets.collection_id avec (up) ou sans (down) ondelete=SET NULL.
    Postgres uniquement : le nom par défaut de la contrainte est snippets_collection_id_fkey.
    IF EXISTS rend l'opération sûre même si le nom diffère légèrement."""
    bind = op.get_bind()
    if bind.dialect.name != 'postgresql':
        return  # SQLite : create_all rebuild le bon schéma ; rien à faire.
    if up:
        bind.execute(sa.text(
            "ALTER TABLE snippets "
            "DROP CONSTRAINT IF EXISTS snippets_collection_id_fkey, "
            "ADD CONSTRAINT snippets_collection_id_fkey "
            "FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL"
        ))
    else:
        bind.execute(sa.text(
            "ALTER TABLE snippets "
            "DROP CONSTRAINT IF EXISTS snippets_collection_id_fkey, "
            "ADD CONSTRAINT snippets_collection_id_fkey "
            "FOREIGN KEY (collection_id) REFERENCES collections(id)"
        ))


def upgrade() -> None:
    """Upgrade schema."""
    # H4 : colonne de version de token (défaut 0 pour les users existants).
    op.add_column(
        'users',
        sa.Column('token_version', sa.Integer(), nullable=False, server_default='0'),
    )
    # L2 : ondelete=SET NULL sur la FK (Postgres only).
    _set_null_fk(up=True)


def downgrade() -> None:
    """Downgrade schema."""
    _set_null_fk(up=False)
    op.drop_column('users', 'token_version')
