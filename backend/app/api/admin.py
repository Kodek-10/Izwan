from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from ..core.database import get_db
from ..core.security import get_current_admin
from .. import models, schemas

router = APIRouter()

ADMIN = models.UserRole.ADMIN.value
USER = models.UserRole.USER.value


def _admin_count(db: Session) -> int:
    return db.query(models.User).filter(models.User.role == ADMIN).count()


# Matrice des droits (source de vérité applicative, servie à l'écran « Rôles & permissions »).
_CAPABILITIES = [
    ("manage_own_content", "Gérer son propre contenu", {USER: True, ADMIN: True}),
    ("manage_users", "Gérer les utilisateurs et leurs rôles", {USER: False, ADMIN: True}),
    ("supervise_system", "Superviser l'IA & le système", {USER: False, ADMIN: True}),
    ("view_audit", "Consulter l'audit", {USER: False, ADMIN: True}),
]


@router.get("/roles", response_model=schemas.RolesMatrix)
def roles_matrix(admin: models.User = Depends(get_current_admin)):
    """Matrice rôles x permissions (lecture seule), définie par l'application."""
    return schemas.RolesMatrix(
        roles=[USER, ADMIN],
        capabilities=[
            schemas.RoleCapability(key=key, label=label, roles=roles)
            for key, label, roles in _CAPABILITIES
        ],
    )


@router.get("/users", response_model=List[schemas.User])
def list_users(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    """Liste tous les comptes (réservé aux administrateurs)."""
    return db.query(models.User).order_by(models.User.id).all()


@router.patch("/users/{user_id}", response_model=schemas.User)
def update_user_role(
    user_id: int,
    payload: schemas.RoleUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    """Promeut ou rétrograde un compte (USER <-> ADMIN)."""
    if payload.role not in (USER, ADMIN):
        raise HTTPException(status_code=400, detail="Rôle invalide")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    # Garde-fou : ne jamais retirer le dernier administrateur.
    if user.role == ADMIN and payload.role != ADMIN and _admin_count(db) <= 1:
        raise HTTPException(status_code=400, detail="Impossible de rétrograder le dernier administrateur")

    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    """Supprime un compte et tout son contenu (snippets, collections)."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte")
    if user.role == ADMIN and _admin_count(db) <= 1:
        raise HTTPException(status_code=400, detail="Impossible de supprimer le dernier administrateur")

    db.query(models.Snippet).filter(models.Snippet.owner_id == user.id).delete(synchronize_session=False)
    db.query(models.Collection).filter(models.Collection.owner_id == user.id).delete(synchronize_session=False)
    db.delete(user)
    db.commit()
    return None


@router.get("/stats", response_model=schemas.AdminStats)
def admin_stats(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    """Statistiques globales pour le tableau de bord admin."""
    by_language = {
        language: count
        for language, count in db.query(models.Snippet.language, func.count(models.Snippet.id))
        .group_by(models.Snippet.language)
        .all()
    }
    return schemas.AdminStats(
        total_users=db.query(models.User).count(),
        total_admins=_admin_count(db),
        total_snippets=db.query(models.Snippet).count(),
        total_collections=db.query(models.Collection).count(),
        snippets_by_language=by_language,
    )
