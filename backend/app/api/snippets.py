from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..core.security import get_current_user
from ..core import rate_limit as rl
from .. import models, schemas

from ..services.embedding_service import embedding_service
from ..services.ai_service import ai_service

router = APIRouter()

def get_or_create_tags(db: Session, tag_names: List[str]):
    tags = []
    for name in tag_names:
        name = name.lower().strip()
        if not name:
            continue
        tag = db.query(models.Tag).filter(models.Tag.name == name).first()
        if not tag:
            tag = models.Tag(name=name)
            db.add(tag)
            db.commit()
            db.refresh(tag)
        tags.append(tag)
    return tags

def update_snippet_embedding(db: Session, snippet: models.Snippet):
    # Combine title, description and code for a rich embedding
    text_to_embed = f"{snippet.title} {snippet.description or ''} {snippet.code}"
    vector = embedding_service.generate_embedding(text_to_embed)
    serialized_vector = embedding_service.serialize_embedding(vector)
    
    if snippet.embedding:
        snippet.embedding.vector = serialized_vector
    else:
        db_embedding = models.SnippetEmbedding(snippet_id=snippet.id, vector=serialized_vector)
        db.add(db_embedding)

    db.query(models.SnippetEmbeddingChunk).filter(
        models.SnippetEmbeddingChunk.snippet_id == snippet.id
    ).delete()

    chunk_source = f"{snippet.description or ''}\n{snippet.code}"
    chunks = embedding_service.chunk_text(chunk_source)
    for index, chunk in enumerate(chunks):
        chunk_text = f"{snippet.title}\nLanguage: {snippet.language}\n{chunk}"
        chunk_vector = embedding_service.generate_embedding(chunk_text)
        db.add(models.SnippetEmbeddingChunk(
            snippet_id=snippet.id,
            chunk_index=index,
            content=chunk,
            vector=embedding_service.serialize_embedding(chunk_vector),
        ))
    db.commit()

@router.post("/", response_model=schemas.Snippet, status_code=status.HTTP_201_CREATED)
async def create_snippet(snippet: schemas.SnippetCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if rl.is_creation_rate_limited(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many snippet creations. Please try again later.",
            headers={"Retry-After": str(rl.creation_retry_after(current_user.id))}
        )
    # M2 — valider l'appartenance de la collection (anti-IDOR cross-tenant + anti-énumération).
    if snippet.collection_id is not None:
        collection = db.query(models.Collection).filter(
            models.Collection.id == snippet.collection_id,
            models.Collection.owner_id == current_user.id,
        ).first()
        if collection is None:
            raise HTTPException(status_code=404, detail="Collection not found")
    # Auto-generate description and tags via AI if not provided
    ai_description = snippet.description
    ai_tags = snippet.tags or []
    
    if not ai_description or not ai_tags:
        try:
            ai_result = await ai_service.generate_tags_and_description(snippet.code, snippet.language)
            if not ai_description:
                ai_description = ai_result.get("description", "")
            if not ai_tags:
                ai_tags = ai_result.get("tags", [])
            print(f"INFO: IA a généré description='{ai_description}', tags={ai_tags}")
        except Exception as e:
            print(f"WARN: Échec de la génération IA pour le snippet: {e}")
            # Fallback: on continue sans description/tags IA
    
    db_snippet = models.Snippet(
        title=snippet.title,
        language=snippet.language,
        code=snippet.code,
        description=ai_description,
        is_favorite=snippet.is_favorite,
        collection_id=snippet.collection_id,
        owner_id=current_user.id
    )
    if ai_tags:
        db_snippet.tags = get_or_create_tags(db, ai_tags)
    
    db.add(db_snippet)
    db.commit()
    db.refresh(db_snippet)
    
    # Generate embedding
    update_snippet_embedding(db, db_snippet)

    rl.record_creation(current_user.id)
    return db_snippet

@router.get("/", response_model=schemas.PaginatedSnippet)
def read_snippets(skip: int = 0, limit: int = 100, favorite: bool = None, collection_id: int = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Snippet).filter(models.Snippet.owner_id == current_user.id)
    if favorite is not None:
        query = query.filter(models.Snippet.is_favorite == favorite)
    if collection_id is not None:
        query = query.filter(models.Snippet.collection_id == collection_id)
    total = query.count()
    snippets = query.offset(skip).limit(limit).all()
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": snippets
    }

@router.get("/graph", response_model=schemas.SnippetGraph)
def snippet_graph(
    threshold: float = 0.5,
    max_neighbors: int = 4,
    duplicate_threshold: float = 0.9,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Graphe de proximité sémantique entre les snippets de l'utilisateur.

    Chaque snippet est relié à ses plus proches voisins (similarité cosinus des
    embeddings) au-dessus de `threshold`, limité à `max_neighbors` par nœud.
    Les paires dont la similarité dépasse `duplicate_threshold` sont signalées
    comme doublons potentiels.
    """
    snippets = (
        db.query(models.Snippet)
        .filter(models.Snippet.owner_id == current_user.id)
        .all()
    )

    items = []
    for s in snippets:
        if s.embedding:
            vector = embedding_service.deserialize_embedding(s.embedding.vector)
            items.append((s, vector))

    nodes = [
        schemas.GraphNode(id=s.id, title=s.title, language=s.language)
        for s, _ in items
    ]

    links = []
    seen = set()
    for i, (s_i, v_i) in enumerate(items):
        scored = []
        for j, (s_j, v_j) in enumerate(items):
            if i == j:
                continue
            score = embedding_service.cosine_similarity(v_i, v_j)
            if score >= threshold:
                scored.append((s_j.id, score))
        scored.sort(key=lambda x: x[1], reverse=True)
        for target_id, score in scored[:max_neighbors]:
            a, b = sorted((s_i.id, target_id))
            if (a, b) in seen:
                continue
            seen.add((a, b))
            links.append(
                schemas.GraphLink(
                    source=a,
                    target=b,
                    score=round(float(score), 3),
                    duplicate=bool(score >= duplicate_threshold),
                )
            )

    return schemas.SnippetGraph(nodes=nodes, links=links)

@router.get("/{snippet_id}", response_model=schemas.Snippet)
def read_snippet(snippet_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_snippet = db.query(models.Snippet).filter(models.Snippet.id == snippet_id, models.Snippet.owner_id == current_user.id).first()
    if db_snippet is None:
        raise HTTPException(status_code=404, detail="Snippet not found")
    return db_snippet

@router.put("/{snippet_id}", response_model=schemas.Snippet)
def update_snippet(snippet_id: int, snippet: schemas.SnippetUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_snippet = db.query(models.Snippet).filter(models.Snippet.id == snippet_id, models.Snippet.owner_id == current_user.id).first()
    if db_snippet is None:
        raise HTTPException(status_code=404, detail="Snippet not found")
    
    update_data = snippet.model_dump(exclude_unset=True)
    
    if "tags" in update_data:
        db_snippet.tags = get_or_create_tags(db, update_data["tags"])
        del update_data["tags"]

    # M2 — valider l'appartenance de la collection si elle est modifiée.
    if "collection_id" in update_data and update_data["collection_id"] is not None:
        collection = db.query(models.Collection).filter(
            models.Collection.id == update_data["collection_id"],
            models.Collection.owner_id == current_user.id,
        ).first()
        if collection is None:
            raise HTTPException(status_code=404, detail="Collection not found")
        
    for key, value in update_data.items():
        setattr(db_snippet, key, value)
    
    db.commit()
    db.refresh(db_snippet)
    
    # Update embedding
    update_snippet_embedding(db, db_snippet)
    
    return db_snippet

@router.delete("/{snippet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_snippet(snippet_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_snippet = db.query(models.Snippet).filter(models.Snippet.id == snippet_id, models.Snippet.owner_id == current_user.id).first()
    if db_snippet is None:
        raise HTTPException(status_code=404, detail="Snippet not found")
    db.delete(db_snippet)
    db.commit()
    return None
