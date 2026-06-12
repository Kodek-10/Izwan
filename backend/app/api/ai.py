from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from ..services.ai_service import ai_service
from ..services.embedding_service import embedding_service
from ..core.database import get_db
from ..core.security import get_current_user
from .. import models, schemas
import json

router = APIRouter()

class EnrichRequest(BaseModel):
    code: str
    language: str

class EnrichResponse(BaseModel):
    tags: List[str]
    description: str

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: str

class ExplainRequest(BaseModel):
    code: str
    language: str

class ExplainResponse(BaseModel):
    explanation: str

@router.post("/enrich", response_model=EnrichResponse)
async def enrich_snippet(request: EnrichRequest):
    try:
        result = await ai_service.generate_tags_and_description(request.code, request.language)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/explain", response_model=ExplainResponse)
async def explain_snippet(request: ExplainRequest):
    try:
        explanation = await ai_service.explain_code(request.code, request.language)
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    try:
        # 1. Recherche sémantique pour trouver le contexte (Top 5 snippets)
        query_vector = embedding_service.generate_embedding(request.query)
        snippets = db.query(models.Snippet).filter(models.Snippet.owner_id == current_user.id).all()
        
        results_with_score = []
        for s in snippets:
            if s.embedding:
                snippet_vector = json.loads(s.embedding.vector)
                score = embedding_service.cosine_similarity(query_vector, snippet_vector)
                if score > 0.2: # Seuil un peu plus bas pour le chat
                    results_with_score.append({
                        "title": s.title,
                        "code": s.code,
                        "language": s.language,
                        "description": s.description,
                        "score": score
                    })
        
        results_with_score.sort(key=lambda x: x["score"], reverse=True)
        context_snippets = results_with_score[:5]
        
        # 2. Appel au service IA avec le contexte
        answer = await ai_service.chat_with_context(request.query, context_snippets)
        return {"answer": answer}
        
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
