"""Limiteur de tentatives en mémoire (anti brute-force sur /auth/login).

Simple et sans dépendance : fenêtre glissante par clé (ex. IP). Suffisant pour un
process unique ; pour du multi-worker en prod, préférer un backend partagé (Redis).
"""
import os
import time
from collections import defaultdict, deque
from typing import Deque, Dict

WINDOW_SECONDS = 300  # 5 minutes
MAX_FAILURES = 5
REGISTER_MAX_FAILURES = 10  # plafond /register : anti-spam de comptes

# Derriere un reverse-proxy de confiance, on lit l'IP reelle dans X-Forwarded-For.
# Activer (BEHIND_PROXY=true) UNIQUEMENT si le proxy ecrase/nettoie tout XFF client
# (sinon usurpation possible). Par defaut : faux (safe, non falsifiable par le client).
BEHIND_PROXY = os.getenv("BEHIND_PROXY", "").lower() in ("1", "true", "yes")


def get_client_ip(request) -> str:
    """IP client reelle pour le rate-limit. Honore X-Forwarded-For (premier hop)
    uniquement quand BEHIND_PROXY est vrai ; sinon request.client.host (non falsifiable)."""
    if BEHIND_PROXY:
        xff = request.headers.get("x-forwarded-for")
        if xff:
            return xff.split(",")[0].strip() or "unknown"
    return request.client.host if request.client else "unknown"

_failures: Dict[str, Deque[float]] = defaultdict(deque)


def _prune(dq: Deque[float], now: float) -> None:
    while dq and now - dq[0] > WINDOW_SECONDS:
        dq.popleft()


def is_rate_limited(key: str, max_failures: int = MAX_FAILURES) -> bool:
    dq = _failures[key]
    _prune(dq, time.time())
    return len(dq) >= max_failures


def record_failure(key: str) -> None:
    now = time.time()
    dq = _failures[key]
    _prune(dq, now)
    dq.append(now)


def reset(key: str) -> None:
    _failures.pop(key, None)


def retry_after_seconds(key: str) -> int:
    dq = _failures.get(key)
    if not dq:
        return 0
    return max(1, int(WINDOW_SECONDS - (time.time() - dq[0])))


# --- Generic creation rate limiting (per authenticated user) ---
_CREATE_WINDOW = 3600  # 1 hour
_MAX_CREATIONS = 30  # max 30 creations per hour

_creation_counts: Dict[str, Deque[float]] = defaultdict(deque)

def _prune_creation(dq: Deque[float], now: float) -> None:
    while dq and now - dq[0] > _CREATE_WINDOW:
        dq.popleft()

def is_creation_rate_limited(user_id: int, max_creations: int = _MAX_CREATIONS) -> bool:
    key = f"create:{user_id}"
    now = time.time()
    dq = _creation_counts[key]
    _prune_creation(dq, now)
    return len(dq) >= max_creations

def record_creation(user_id: int) -> None:
    key = f"create:{user_id}"
    now = time.time()
    dq = _creation_counts[key]
    _prune_creation(dq, now)
    dq.append(now)

def creation_retry_after(user_id: int) -> int:
    key = f"create:{user_id}"
    dq = _creation_counts.get(key)
    if not dq:
        return 0
    return max(1, int(_CREATE_WINDOW - (time.time() - dq[0])))

# --- AI endpoints rate limiting (per authenticated user) ---
_AI_WINDOW = 3600  # 1 hour
_AI_MAX_CALLS = int(os.getenv("AI_RATE_LIMIT_PER_HOUR", "30"))

_ai_counts: Dict[str, Deque[float]] = defaultdict(deque)

def _prune_ai(dq: Deque[float], now: float) -> None:
    while dq and now - dq[0] > _AI_WINDOW:
        dq.popleft()

def is_ai_rate_limited(user_id: int, max_calls: int = _AI_MAX_CALLS) -> bool:
    key = f"ai:{user_id}"
    now = time.time()
    dq = _ai_counts[key]
    _prune_ai(dq, now)
    return len(dq) >= max_calls

def record_ai_call(user_id: int) -> None:
    key = f"ai:{user_id}"
    now = time.time()
    dq = _ai_counts[key]
    _prune_ai(dq, now)
    dq.append(now)

def ai_retry_after(user_id: int) -> int:
    key = f"ai:{user_id}"
    dq = _ai_counts.get(key)
    if not dq:
        return 0
    return max(1, int(_AI_WINDOW - (time.time() - dq[0])))
