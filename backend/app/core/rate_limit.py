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
