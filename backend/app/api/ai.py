from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from ..services.ai_service import ai_service
from ..services.embedding_service import embedding_service
from ..core.database import get_db
from ..core.security import get_current_user
from ..core.privacy import AIR_GAPPED_FORCED, is_air_gapped, set_air_gapped
from .. import models, schemas

router = APIRouter()

class EnrichRequest(BaseModel):
    code: str
    language: str

class EnrichResponse(BaseModel):
    tags: List[str]
    description: str

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    query: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    answer: str

class ExplainRequest(BaseModel):
    code: str
    language: str

class ExplainResponse(BaseModel):
    explanation: str

class PrivacySettings(BaseModel):
    air_gapped: bool
    forced: bool = False
    generation_provider: str
    embedding_provider: str

class PrivacyUpdate(BaseModel):
    air_gapped: bool

def get_privacy_settings() -> PrivacySettings:
    return PrivacySettings(
        air_gapped=is_air_gapped(),
        forced=AIR_GAPPED_FORCED,
        generation_provider="ollama" if is_air_gapped() else "auto",
        embedding_provider="fastembed",
    )

@router.get("/privacy", response_model=PrivacySettings)
def read_privacy_settings(current_user: models.User = Depends(get_current_user)):
    return get_privacy_settings()

@router.put("/privacy", response_model=PrivacySettings)
def update_privacy_settings(
    request: PrivacyUpdate,
    current_user: models.User = Depends(get_current_user),
):
    set_air_gapped(request.air_gapped)
    return get_privacy_settings()

@router.post("/enrich", response_model=EnrichResponse)
async def enrich_snippet(request: EnrichRequest, accept_language: Optional[str] = Header(None)):
    try:
        lang = "en" if accept_language and "en" in accept_language.lower() else "fr"
        result = await ai_service.generate_tags_and_description(request.code, request.language, lang=lang)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/explain", response_model=ExplainResponse)
async def explain_snippet(request: ExplainRequest, accept_language: Optional[str] = Header(None)):
    try:
        lang = "en" if accept_language and "en" in accept_language.lower() else "fr"
        explanation = await ai_service.explain_code(request.code, request.language, lang=lang)
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user),
    accept_language: Optional[str] = Header(None)
):
    try:
        lang = "en" if accept_language and "en" in accept_language.lower() else "fr"
        # 1. Recherche sémantique pour trouver le contexte (Top 5 snippets)
        query_vector = embedding_service.generate_embedding(request.query)
        snippets = db.query(models.Snippet).filter(models.Snippet.owner_id == current_user.id).all()
        
        results_with_score = []
        for s in snippets:
            if s.embedding:
                snippet_vector = embedding_service.deserialize_embedding(s.embedding.vector)
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
        
        # 2. Appel au service IA avec le contexte + l'historique de conversation
        history = [{"role": m.role, "content": m.content} for m in request.history]
        answer = await ai_service.chat_with_context(request.query, context_snippets, lang=lang, history=history)
        return {"answer": answer}
        
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class AdaptRequest(BaseModel):
    code: str
    language: str
    surrounding_code: str

class AdaptResponse(BaseModel):
    adapted_code: str

@router.post("/adapt", response_model=AdaptResponse)
async def adapt_snippet_code(request: AdaptRequest, accept_language: Optional[str] = Header(None)):
    try:
        lang = "en" if accept_language and "en" in accept_language.lower() else "fr"
        adapted = await ai_service.adapt_code(request.code, request.language, request.surrounding_code, lang=lang)
        return {"adapted_code": adapted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TranslateRequest(BaseModel):
    code: str
    source_language: str
    target_language: str

class TranslateResponse(BaseModel):
    translated_code: str
    description: Optional[str] = None
    tags: Optional[List[str]] = None

@router.post("/translate", response_model=TranslateResponse)
async def translate_snippet_code(request: TranslateRequest, accept_language: Optional[str] = Header(None)):
    try:
        lang = "en" if accept_language and "en" in accept_language.lower() else "fr"
        result = await ai_service.translate_code(request.code, request.source_language, request.target_language, lang=lang)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
