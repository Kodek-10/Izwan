import os
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from jwt import PyJWTError as JWTError
from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from ..core.database import get_db
from .. import models

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError(
        "JWT_SECRET_KEY environment variable is required. "
        "Set a secure key via environment variable or .env file."
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

# H2 / CWE-922 : le JWT vit dans un cookie httpOnly (non lisible par JS) plutot qu'en
# localStorage. Le navigateur l'envoie automatiquement (credentials: include).
AUTH_COOKIE_NAME = "token"
SESSION_FLAG_COOKIE = "session"  # non-httpOnly, non-secret : juste un booléen lisible
                                  # par JS pour isAuthenticated() (les gardes restent synchrones).
# Secure=on uniquement si HTTPS (prod). Defaut faux = safe pour le dev http://localhost.
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "").lower() in ("1", "true", "yes")

import bcrypt

# auto_error=False : en l'absence d'en-tête Authorization on renvoie None (pas une 401
# immédiate) pour retomber sur le cookie (H2 dual-read), puis lever 401 si aucun des deux.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)


def set_auth_cookie(response: Response, token: str) -> None:
    """Pose le JWT en cookie httpOnly + un cookie de présence lisible par JS.
    Le token est fourni par l'appelant (login) qui le réutilise aussi dans le corps JSON."""
    opts = {"httponly": True, "samesite": "lax", "secure": COOKIE_SECURE}
    response.set_cookie(
        AUTH_COOKIE_NAME, token, max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60, path="/", **opts
    )
    response.set_cookie(
        SESSION_FLAG_COOKIE, "1", max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/", samesite="lax", secure=COOKIE_SECURE,
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(AUTH_COOKIE_NAME, path="/")
    response.delete_cookie(SESSION_FLAG_COOKIE, path="/")

def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

PASSWORD_MIN_LENGTH = 8

def password_policy_error(password: str, lang: str = "fr") -> Optional[str]:
    """Retourne un message d'erreur si le mot de passe est trop faible, sinon None."""
    if len(password) < PASSWORD_MIN_LENGTH:
        return (
            f"Password must be at least {PASSWORD_MIN_LENGTH} characters."
            if lang == "en"
            else f"Le mot de passe doit contenir au moins {PASSWORD_MIN_LENGTH} caractères."
        )
    return None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    # Dual-read (H2) : en-tête Authorization d'abord (clients API + tests Bearer),
    # puis cookie httpOnly (navigateur). Aucun des deux -> 401.
    if not token:
        token = request.cookies.get(AUTH_COOKIE_NAME)
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    # Révocation (H4) : le token doit porter le n° de version courant de l'utilisateur.
    # Un token sans `ver` (antérieur à ce fix) est révoqué -> forcé à re-login.
    token_ver = payload.get("ver")
    if not isinstance(token_ver, int) or token_ver != user.token_version:
        raise credentials_exception
    return user

async def get_current_admin(current_user: models.User = Depends(get_current_user)):
    """Role Guard : n'autorise que les comptes ADMIN, sinon renvoie 403."""
    if current_user.role != models.UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )
    return current_user
