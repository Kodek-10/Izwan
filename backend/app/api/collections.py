from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ..core.database import get_db
from ..core.security import get_current_user
from ..core import rate_limit as rl
from .. import models, schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Collection])
def read_collections(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Collection).filter(models.Collection.owner_id == current_user.id).all()

@router.post("/", response_model=schemas.Collection)
def create_collection(collection: schemas.CollectionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if rl.is_creation_rate_limited(current_user.id, max_creations=20):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many collection creations. Please try again later.",
            headers={"Retry-After": str(rl.creation_retry_after(current_user.id))}
        )
    db_collection = models.Collection(**collection.model_dump(), owner_id=current_user.id)
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)
    rl.record_creation(current_user.id)
    return db_collection

@router.get("/{id}", response_model=schemas.Collection)
def read_collection(id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    collection = db.query(models.Collection).filter(models.Collection.id == id, models.Collection.owner_id == current_user.id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    return collection

@router.put("/{id}", response_model=schemas.Collection)
def update_collection(id: int, collection_update: schemas.CollectionUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_collection = db.query(models.Collection).filter(models.Collection.id == id, models.Collection.owner_id == current_user.id).first()
    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    update_data = collection_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_collection, key, value)
    
    db.commit()
    db.refresh(db_collection)
    return db_collection

@router.delete("/{id}")
def delete_collection(id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_collection = db.query(models.Collection).filter(models.Collection.id == id, models.Collection.owner_id == current_user.id).first()
    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Détache les snippets rattachés AVANT la suppression (L2) :
    # sans ça Postgres lève IntegrityError (FK RESTRICT) -> 500 ; SQLite -> orphelins.
    # Filtre owner_id == current_user.id : on ne touche que ses propres snippets (cohérent M2).
    db.query(models.Snippet).filter(
        models.Snippet.collection_id == id,
        models.Snippet.owner_id == current_user.id,
    ).update({models.Snippet.collection_id: None}, synchronize_session=False)
    db.delete(db_collection)
    db.commit()
    return {"message": "Collection deleted successfully"}
