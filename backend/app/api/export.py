from fastapi import APIRouter, Depends, Response, Query, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from ..core.database import get_db
from ..core.security import get_current_user
from ..services.export_service import export_service
from .. import models

router = APIRouter()

@router.get("/markdown")
def export_markdown(
    collection_id: Optional[int] = Query(None),
    favorite_only: bool = Query(False),
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user),
    accept_language: Optional[str] = Header(None)
):
    lang = "en" if accept_language and "en" in accept_language.lower() else "fr"
    content = export_service.export_to_markdown(db, current_user.id, collection_id, favorite_only, lang=lang)
    return Response(content=content, media_type="text/markdown", headers={"Content-Disposition": "attachment; filename=snippets.md"})

@router.get("/pdf")
def export_pdf(
    collection_id: Optional[int] = Query(None),
    favorite_only: bool = Query(False),
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user),
    accept_language: Optional[str] = Header(None)
):
    lang = "en" if accept_language and "en" in accept_language.lower() else "fr"
    pdf_buffer = export_service.export_to_pdf(db, current_user.id, collection_id, favorite_only, lang=lang)
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=snippets.pdf"})
