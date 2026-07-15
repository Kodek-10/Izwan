from fastapi import APIRouter, Depends, HTTPException, status, Header, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional
from ..core.database import get_db
from ..core import security
from ..core import rate_limit
from .. import models, schemas
from ..core.audit import record_audit

router = APIRouter()

def get_lang(accept_language: Optional[str] = None) -> str:
    return "en" if accept_language and "en" in accept_language.lower() else "fr"

@router.post("/register", response_model=schemas.User)
def register(request: Request, user: schemas.UserCreate, db: Session = Depends(get_db), accept_language: Optional[str] = Header(None)):
    lang = get_lang(accept_language)
    # Anti-spam de création de comptes : toute tentative compte (succès ou échec).
    rl_key = f"register:{rate_limit.get_client_ip(request)}"
    if rate_limit.is_rate_limited(rl_key, max_failures=rate_limit.REGISTER_MAX_FAILURES):
        retry = rate_limit.retry_after_seconds(rl_key)
        detail = (
            f"Too many registration attempts. Try again in {retry}s." if lang == "en"
            else f"Trop de tentatives d'inscription. Réessayez dans {retry}s."
        )
        raise HTTPException(status_code=429, detail=detail, headers={"Retry-After": str(retry)})
    rate_limit.record_failure(rl_key)  # comptabilise cette tentative (anti-bypass)
    pw_error = security.password_policy_error(user.password, lang)
    if pw_error:
        raise HTTPException(status_code=400, detail=pw_error)
    db_user = db.query(models.User).filter(
        (models.User.username == user.username) | (models.User.email == user.email)
    ).first()
    if db_user:
        detail = "Username or email already registered" if lang == "en" else "Nom d'utilisateur ou email déjà enregistré"
        raise HTTPException(status_code=400, detail=detail)

    hashed_password = security.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        display_name=user.display_name,
        hashed_password=hashed_password,
    )
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

    if security.verify_password(data.new_password, current_user.hashed_password):
        detail = "New password cannot be the same as the current password" if lang == "en" else "Le nouveau mot de passe ne peut pas être identique à l'actuel"
        raise HTTPException(status_code=400, detail=detail)

    pw_error = security.password_policy_error(data.new_password, lang)
    if pw_error:
        raise HTTPException(status_code=400, detail=pw_error)

    current_user.hashed_password = security.get_password_hash(data.new_password)
    # Révoque TOUS les tokens existants (y compris un éventuel token volé) en
    # incrémentant la version (H4 / CWE-613). Le token courant devient invalide -> re-login.
    current_user.token_version += 1
    db.commit()
    msg = "Password updated successfully" if lang == "en" else "Mot de passe mis à jour avec succès"
    return {"message": msg}


@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
    accept_language: Optional[str] = Header(None)
):
    lang = get_lang(accept_language)
    client_ip = rate_limit.get_client_ip(request)
    rl_key = f"login:{client_ip}"
    if rate_limit.is_rate_limited(rl_key):
        retry = rate_limit.retry_after_seconds(rl_key)
        detail = (
            f"Too many login attempts. Try again in {retry}s."
            if lang == "en"
            else f"Trop de tentatives de connexion. Réessayez dans {retry}s."
        )
        raise HTTPException(status_code=429, detail=detail, headers={"Retry-After": str(retry)})

    # Allow login with either username or email
    username_or_email = form_data.username
    if "@" in username_or_email:
        user = db.query(models.User).filter(models.User.email == username_or_email).first()
    else:
        user = db.query(models.User).filter(models.User.username == username_or_email).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        rate_limit.record_failure(rl_key)
        record_audit(db, "auth", "login_failed", actor=form_data.username)
        detail = "Incorrect username or password" if lang == "en" else "Nom d'utilisateur ou mot de passe incorrect"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

    rate_limit.reset(rl_key)
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username, "role": user.role, "ver": user.token_version},
        expires_delta=access_token_expires,
    )
    # H2 : pose le JWT en cookie httpOnly (en plus du corps JSON pour back-compat clients/tests).
    security.set_auth_cookie(response, access_token)
    record_audit(db, "auth", "login", actor=user.username)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(response: Response):
    # Vide le cookie httpOnly (H2) : JS ne peut pas le faire lui-même.
    security.clear_auth_cookie(response)
    return {"message": "Logged out"}

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
