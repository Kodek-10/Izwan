"""Limiteur de tentatives en mémoire (anti brute-force sur /auth/login).

Simple et sans dépendance : fenêtre glissante par clé (ex. IP). Suffisant pour un
process unique ; pour du multi-worker en prod, préférer un backend partagé (Redis).
"""
import time
from collections import defaultdict, deque
from typing import Deque, Dict

WINDOW_SECONDS = 300  # 5 minutes
MAX_FAILURES = 5

_failures: Dict[str, Deque[float]] = defaultdict(deque)


def _prune(dq: Deque[float], now: float) -> None:
    while dq and now - dq[0] > WINDOW_SECONDS:
        dq.popleft()


def is_rate_limited(key: str) -> bool:
    dq = _failures[key]
    _prune(dq, time.time())
    return len(dq) >= MAX_FAILURES


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
