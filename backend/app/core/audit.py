from sqlalchemy.orm import Session

from .. import models


def record_audit(
    db: Session,
    category: str,
    action: str,
    actor: str | None = None,
    target: str | None = None,
    detail: str | None = None,
) -> None:
    """Journalise un événement d'audit (best-effort, n'interrompt jamais l'appelant)."""
    try:
        db.add(
            models.AuditLog(
                category=category,
                action=action,
                actor=actor,
                target=target,
                detail=detail,
            )
        )
        db.commit()
    except Exception:
        db.rollback()
