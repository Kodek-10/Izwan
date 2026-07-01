from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from ..core.database import get_db
from ..core.security import get_current_admin
from ..core.audit import record_audit
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

    # Garde-fou : un administrateur ne peut pas modifier son propre rôle (anti auto-rétrogradation).
    if user.id == admin.id and payload.role != ADMIN:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas modifier votre propre rôle")

    # Garde-fou : ne jamais retirer le dernier administrateur.
    if user.role == ADMIN and payload.role != ADMIN and _admin_count(db) <= 1:
        raise HTTPException(status_code=400, detail="Impossible de rétrograder le dernier administrateur")

    user.role = payload.role
    db.commit()
    db.refresh(user)
    record_audit(db, "admin", "role_change", actor=admin.username, target=user.username, detail=payload.role)
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

    target_username = user.username
    db.query(models.Snippet).filter(models.Snippet.owner_id == user.id).delete(synchronize_session=False)
    db.query(models.Collection).filter(models.Collection.owner_id == user.id).delete(synchronize_session=False)
    db.delete(user)
    db.commit()
    record_audit(db, "admin", "user_delete", actor=admin.username, target=target_username)
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


@router.get("/ai-usage", response_model=schemas.AiUsageStats)
def ai_usage_stats(
    days: int = 30,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    """Compteurs d'appels IA par fonction sur les N derniers jours."""
    from datetime import datetime, timedelta, timezone

    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (
        db.query(models.AiUsage.feature, func.count(models.AiUsage.id))
        .filter(models.AiUsage.created_at >= since)
        .group_by(models.AiUsage.feature)
        .all()
    )
    by_feature = {feature: count for feature, count in rows}

    day_rows = (
        db.query(func.date(models.AiUsage.created_at), func.count(models.AiUsage.id))
        .filter(models.AiUsage.created_at >= since)
        .group_by(func.date(models.AiUsage.created_at))
        .all()
    )
    counts_by_day = {str(day): count for day, count in day_rows}
    today = datetime.now(timezone.utc).date()
    by_day = [
        schemas.AiUsageDay(
            date=(today - timedelta(days=offset)).isoformat(),
            count=counts_by_day.get((today - timedelta(days=offset)).isoformat(), 0),
        )
        for offset in range(days - 1, -1, -1)
    ]

    return schemas.AiUsageStats(
        days=days,
        total=sum(by_feature.values()),
        by_feature=by_feature,
        by_day=by_day,
    )


@router.get("/audit", response_model=List[schemas.AuditEntry])
def audit_log(
    category: Optional[str] = None,
    days: int = 30,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    """Journal d'audit des actions sensibles (filtres : catégorie, période)."""
    from datetime import datetime, timedelta, timezone

    since = datetime.now(timezone.utc) - timedelta(days=days)
    query = db.query(models.AuditLog).filter(models.AuditLog.created_at >= since)
    if category:
        query = query.filter(models.AuditLog.category == category)
    return query.order_by(models.AuditLog.created_at.desc()).limit(limit).all()


@router.get("/snippets", response_model=List[schemas.AdminSnippet])
def list_snippets(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Liste les métadonnées de TOUS les snippets (jamais le code — confidentialité)."""
    rows = db.query(models.Snippet).order_by(models.Snippet.created_at.desc()).all()
    return [
        schemas.AdminSnippet(
            id=s.id,
            title=s.title,
            language=s.language,
            owner=s.owner.username if s.owner else None,
            tags=[t.name for t in s.tags],
            created_at=s.created_at,
        )
        for s in rows
    ]


@router.delete("/snippets/{snippet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_snippet(snippet_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Supprime n'importe quel snippet (modération)."""
    snippet = db.query(models.Snippet).filter(models.Snippet.id == snippet_id).first()
    if snippet is None:
        raise HTTPException(status_code=404, detail="Snippet introuvable")
    db.delete(snippet)
    db.commit()
    return None
