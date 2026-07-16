from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from ..core.database import get_db
from ..core.security import get_current_user
from ..core import rate_limit
from .. import models, schemas

from ..services.embedding_service import embedding_service

router = APIRouter()

@router.get("/", response_model=List[schemas.Snippet])
def search_snippets(q: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Keyword Search (same as before)
    query = db.query(models.Snippet).filter(models.Snippet.owner_id == current_user.id).join(models.Snippet.tags, isouter=True)
    
    search_filter = or_(
        models.Snippet.title.ilike(f"%{q}%"),
        models.Snippet.description.ilike(f"%{q}%"),
        models.Tag.name.ilike(f"%{q}%")
    )
    
    results = query.filter(search_filter).distinct().all()
    return results

@router.get("/semantic", response_model=List[schemas.Snippet])
def semantic_search(query: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user), accept_language: Optional[str] = Header(None)):
    if rate_limit.is_ai_rate_limited(current_user.id):
        retry = rate_limit.ai_retry_after(current_user.id)
        en = accept_language and "en" in accept_language.lower()
        detail = (f"Too many search requests. Try again in {retry}s." if en
                  else f"Trop de recherches sémantiques. Réessayez dans {retry}s.")
        raise HTTPException(status_code=429, detail=detail, headers={"Retry-After": str(retry)})
    rate_limit.record_ai_call(current_user.id)
    # 1. Generate embedding for the query
    query_vector = embedding_service.generate_embedding(query)

    # 2. Score chunk embeddings first so long snippets can match deep content.
    snippets = db.query(models.Snippet).filter(models.Snippet.owner_id == current_user.id).all()
    best_scores = {}
    for s in snippets:
        chunk_scores = []
        for chunk in s.embedding_chunks:
            chunk_vector = embedding_service.deserialize_embedding(chunk.vector)
            chunk_scores.append(embedding_service.cosine_similarity(query_vector, chunk_vector))

        if chunk_scores:
            score = max(chunk_scores)
            if score > 0.3:
                best_scores[s.id] = (s, score)
        elif s.embedding:
            snippet_vector = embedding_service.deserialize_embedding(s.embedding.vector)
            score = embedding_service.cosine_similarity(query_vector, snippet_vector)
            if score > 0.3: # Minimum similarity threshold
                best_scores[s.id] = (s, score)
    
    # Sort by score descending
    results_with_score = sorted(best_scores.values(), key=lambda x: x[1], reverse=True)
    
    # Return top 10 results
    return [r[0] for r in results_with_score[:10]]
