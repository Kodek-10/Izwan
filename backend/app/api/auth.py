from fastapi import APIRouter, Depends, HTTPException, status, Header, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional
import os
import secrets
import json
import base64
import httpx
from urllib.parse import quote
from ..core.database import get_db
from ..core import security
from ..core import rate_limit
from .. import models, schemas
from ..core.audit import record_audit

router = APIRouter()

# --- OAuth (Google / GitHub) ---
BACKEND_PUBLIC_URL = os.getenv("BACKEND_PUBLIC_URL", "http://localhost:8000").rstrip("/")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
OAUTH_SUCCESS_URL = f"{FRONTEND_URL}/auth?oauth=success"
OAUTH_ERROR_URL = f"{FRONTEND_URL}/auth?oauth=error"
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")


def _encode_vscode_state(redirect_uri: str, state: str) -> str:
    """Embarque les paramètres du flux VSCode dans le `state` OAuth du provider.
    Le provider se contente de le refléter au callback -> on le récupère intact."""
    payload = json.dumps({"source": "vscode", "redirect_uri": redirect_uri, "state": state})
    return base64.urlsafe_b64encode(payload.encode()).rstrip(b"=").decode()


def _decode_vscode_state(state: Optional[str]) -> Optional[dict]:
    if not state:
        return None
    try:
        padded = state + "=" * (-len(state) % 4)
        data = json.loads(base64.urlsafe_b64decode(padded).decode())
        if isinstance(data, dict) and data.get("source") == "vscode":
            return data
    except Exception:
        pass
    return None


def _oauth_configured(provider: str) -> bool:
    """True si les clés du provider sont présentes dans l'environnement."""
    if provider == "github":
        return bool(GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET)
    if provider == "google":
        return bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)
    return False


def _oauth_error(lang: str, provider: str):
    raise HTTPException(
        status_code=501,
        detail=(
            f"{provider.title()} authentication is not yet configured. "
            f"Please set the {provider.upper()}_CLIENT_ID and {provider.upper()}_CLIENT_SECRET environment variables."
            if lang == "en"
            else f"L'authentification {provider.title()} n'est pas encore configurée. "
            f"Veuillez définir les variables d'environnement {provider.upper()}_CLIENT_ID et {provider.upper()}_CLIENT_SECRET."
        ),
    )


def _upsert_oauth_user(db: Session, provider: str, oauth_id: str, email: str, display_name: str) -> models.User:
    """Trouve ou crée un utilisateur lié à un compte OAuth.
    - Si un user porte déjà ce provider+id -> retour.
    - Sinon, si l'email existe déjà -> lie le compte (même user, + mot de passe aléatoire).
    - Sinon -> création (username dérivé de l'email, mot de passe aléatoire jamais utilisé)."""
    user = (
        db.query(models.User)
        .filter(models.User.oauth_provider == provider, models.User.oauth_id == oauth_id)
        .first()
    )
    if user:
        return user

    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        existing.oauth_provider = provider
        existing.oauth_id = oauth_id
        # Un compte OAuth ne se connecte jamais par mot de passe -> hash jetable.
        if not existing.hashed_password:
            existing.hashed_password = security.get_password_hash(secrets.token_urlsafe(32))
        db.commit()
        db.refresh(existing)
        return existing

    base = email.split("@")[0][:20] or "user"
    username = base
    i = 2
    while db.query(models.User).filter(models.User.username == username).first():
        username = f"{base}{i}"
        i += 1

    user = models.User(
        username=username,
        email=email,
        display_name=display_name or username,
        hashed_password=security.get_password_hash(secrets.token_urlsafe(32)),
        oauth_provider=provider,
        oauth_id=oauth_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _finalize_oauth(response: Response, db: Session, user: models.User, provider: str, vscode: Optional[dict] = None) -> RedirectResponse:
    """Pose le cookie JWT et redirige vers le frontend. Échec silencieux tolérant :
    l'audit reste tracé mais on ne bloque pas la connexion pour un souci de journal."""
    try:
        record_audit(db, "auth", f"login_{provider}", actor=user.username)
    except Exception:
        pass
    token = security.create_access_token(
        data={"sub": user.username, "role": user.role, "ver": user.token_version},
        expires_delta=timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    security.set_auth_cookie(response, token)
    if vscode:
        # Flux extension VSCode : on remet le token au frontend via un fragment
        # (#token=...) pour qu'il puisse le renvoyer à l'extension. Le fragment
        # n'est jamais envoyé au serveur dans le Referer -> pas de fuite du JWT.
        fragment = (
            f"token={quote(token, safe='')}"
            f"&state={quote(vscode.get('state', ''), safe='')}"
            f"&redirect_uri={quote(vscode.get('redirect_uri', ''), safe='')}"
        )
        return RedirectResponse(url=f"{FRONTEND_URL}/auth#{fragment}")
    return RedirectResponse(url=OAUTH_SUCCESS_URL)

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
def login_github(
    redirect_uri: Optional[str] = None,
    state: Optional[str] = None,
    accept_language: Optional[str] = Header(None),
):
    lang = get_lang(accept_language)
    if not _oauth_configured("github"):
        _oauth_error(lang, "github")
    callback_uri = f"{BACKEND_PUBLIC_URL}/api/v1/auth/github/callback"
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": callback_uri,
        "scope": "read:user user:email",
    }
    if redirect_uri and state:
        params["state"] = quote(_encode_vscode_state(redirect_uri, state), safe="")
    auth_url = "https://github.com/login/oauth/authorize?" + "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(url=auth_url)


@router.get("/github/callback")
def github_callback(
    code: str,
    response: Response,
    state: Optional[str] = None,
    db: Session = Depends(get_db),
    accept_language: Optional[str] = Header(None),
):
    lang = get_lang(accept_language)
    if not _oauth_configured("github"):
        _oauth_error(lang, "github")
    vscode = _decode_vscode_state(state)
    token_url = "https://github.com/login/oauth/access_token"
    headers = {"Accept": "application/json"}
    data = {
        "client_id": GITHUB_CLIENT_ID,
        "client_secret": GITHUB_CLIENT_SECRET,
        "code": code,
        "redirect_uri": f"{BACKEND_PUBLIC_URL}/api/v1/auth/github/callback",
    }
    try:
        with httpx.Client(timeout=15) as client:
            r = client.post(token_url, data=data, headers=headers)
            r.raise_for_status()
            token_json = r.json()
            if "error" in token_json:
                raise httpx.HTTPError(token_json.get("error_description", token_json["error"]))
            access_token = token_json["access_token"]
            profile_headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
            me = client.get("https://api.github.com/user", headers=profile_headers)
            me.raise_for_status()
            profile = me.json()
    except httpx.HTTPError:
        return RedirectResponse(url=OAUTH_ERROR_URL)

    oauth_id = str(profile.get("id", ""))
    email = profile.get("email") or ""
    if not email:
        # L'email public peut manquer -> requête dédiée (scope user:email).
        try:
            with httpx.Client(timeout=15) as client:
                emails = client.get("https://api.github.com/user/emails", headers=profile_headers)
                emails.raise_for_status()
                for entry in emails.json():
                    if entry.get("primary") and entry.get("verified"):
                        email = entry["email"]
                        break
        except httpx.HTTPError:
            email = ""
    if not email:
        return RedirectResponse(url=OAUTH_ERROR_URL)

    user = _upsert_oauth_user(db, "github", oauth_id, email, profile.get("name") or profile.get("login") or "")
    return _finalize_oauth(response, db, user, "github", vscode)


@router.get("/google")
def login_google(
    redirect_uri: Optional[str] = None,
    state: Optional[str] = None,
    accept_language: Optional[str] = Header(None),
):
    lang = get_lang(accept_language)
    if not _oauth_configured("google"):
        _oauth_error(lang, "google")
    callback_uri = f"{BACKEND_PUBLIC_URL}/api/v1/auth/google/callback"
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": callback_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
    }
    if redirect_uri and state:
        params["state"] = quote(_encode_vscode_state(redirect_uri, state), safe="")
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(url=auth_url)


@router.get("/google/callback")
def google_callback(
    code: str,
    response: Response,
    state: Optional[str] = None,
    db: Session = Depends(get_db),
    accept_language: Optional[str] = Header(None),
):
    lang = get_lang(accept_language)
    if not _oauth_configured("google"):
        _oauth_error(lang, "google")
    vscode = _decode_vscode_state(state)
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": f"{BACKEND_PUBLIC_URL}/api/v1/auth/google/callback",
        "grant_type": "authorization_code",
    }
    try:
        with httpx.Client(timeout=15) as client:
            r = client.post(token_url, data=token_data)
            r.raise_for_status()
            token_json = r.json()
            if "error" in token_json:
                raise httpx.HTTPError(token_json.get("error_description", token_json["error"]))
            access_token = token_json["access_token"]
            profile_headers = {"Authorization": f"Bearer {access_token}"}
            me = client.get("https://www.googleapis.com/oauth2/v2/userinfo", headers=profile_headers)
            me.raise_for_status()
            profile = me.json()
    except httpx.HTTPError:
        return RedirectResponse(url=OAUTH_ERROR_URL)

    oauth_id = str(profile.get("id", ""))
    email = profile.get("email", "")
    if not oauth_id or not email:
        return RedirectResponse(url=OAUTH_ERROR_URL)

    user = _upsert_oauth_user(db, "google", oauth_id, email, profile.get("name") or "")
    return _finalize_oauth(response, db, user, "google", vscode)
