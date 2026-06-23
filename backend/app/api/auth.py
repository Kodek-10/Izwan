from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional
from ..core.database import get_db
from ..core import security
from .. import models, schemas
from ..core.audit import record_audit

router = APIRouter()

def get_lang(accept_language: Optional[str] = None) -> str:
    return "en" if accept_language and "en" in accept_language.lower() else "fr"

@router.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db), accept_language: Optional[str] = Header(None)):
    lang = get_lang(accept_language)
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        detail = "Username already registered" if lang == "en" else "Nom d'utilisateur déjà enregistré"
        raise HTTPException(status_code=400, detail=detail)

    hashed_password = security.get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.User)
def update_profile(
    user_update: schemas.UserUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user),
    accept_language: Optional[str] = Header(None)
):
    lang = get_lang(accept_language)
    if user_update.username:
        # Check if username taken
        existing = db.query(models.User).filter(models.User.username == user_update.username, models.User.id != current_user.id).first()
        if existing:
            detail = "Username already taken" if lang == "en" else "Nom d'utilisateur déjà pris"
            raise HTTPException(status_code=400, detail=detail)
        current_user.username = user_update.username

    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-password")
def change_password(
    data: schemas.PasswordChange, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user),
    accept_language: Optional[str] = Header(None)
):
    lang = get_lang(accept_language)
    if not security.verify_password(data.current_password, current_user.hashed_password):
        detail = "Incorrect current password" if lang == "en" else "Mot de passe actuel incorrect"
        raise HTTPException(status_code=400, detail=detail)

    current_user.hashed_password = security.get_password_hash(data.new_password)
    db.commit()
    msg = "Password updated successfully" if lang == "en" else "Mot de passe mis à jour avec succès"
    return {"message": msg}


@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends(),
    accept_language: Optional[str] = Header(None)
):
    lang = get_lang(accept_language)
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        record_audit(db, "auth", "login_failed", actor=form_data.username)
        detail = "Incorrect username or password" if lang == "en" else "Nom d'utilisateur ou mot de passe incorrect"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    record_audit(db, "auth", "login", actor=user.username)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/github")
def login_github(accept_language: Optional[str] = Header(None)):
    lang = get_lang(accept_language)
    detail = "GitHub authentication is not yet configured. Please configure your GitHub API keys." if lang == "en" else "L'authentification GitHub n'est pas encore configurée. Veuillez configurer vos clés API GitHub."
    raise HTTPException(status_code=501, detail=detail)

@router.get("/google")
def login_google(accept_language: Optional[str] = Header(None)):
    lang = get_lang(accept_language)
    detail = "Google authentication is not yet configured. Please configure your Google API keys." if lang == "en" else "L'authentification Google n'est pas encore configurée. Veuillez configurer vos clés API Google."
    raise HTTPException(status_code=501, detail=detail)
