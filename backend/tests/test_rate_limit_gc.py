"""Tests unitaires du GC des cles inactives dans rate_limit (M4 / CWE-401).
Directs sur le module, sans client FastAPI -> instantanes, hors IA/embedding."""
import time

from backend.app.core import rate_limit as rl
from backend.app.core.rate_limit import WINDOW_SECONDS


def _stale_failures(key):
    """Injecte un timestamp perime dans _failures[key] pour forcer le prune/GC."""
    rl._failures[key].append(time.time() - WINDOW_SECONDS - 1)


def test_failures_gc_inactive_key():
    rl._failures.clear()
    _stale_failures("k")
    assert "k" in rl._failures
    limited = rl.is_rate_limited("k")
    assert limited is False
    assert "k" not in rl._failures  # cle inactive supprimee -> borne la memoire


def test_failures_active_key_retained():
    rl._failures.clear()
    rl.record_failure("k2")  # ts frais -> cle active
    rl.is_rate_limited("k2")
    assert "k2" in rl._failures  # pas de GC tant qu'il reste des events en fenetre


def test_failures_no_phantom_key_creation():
    # is_rate_limited sur une cle inconnue ne doit PAS la creer (sinon fuite defaultdict).
    rl._failures.clear()
    limited = rl.is_rate_limited("never_seen")
    assert limited is False
    assert "never_seen" not in rl._failures


def test_creation_gc_inactive_key():
    rl._creation_counts.clear()
    rl._creation_counts["create:1"].append(time.time() - rl._CREATE_WINDOW - 1)
    assert "create:1" in rl._creation_counts
    assert rl.is_creation_rate_limited(1) is False
    assert "create:1" not in rl._creation_counts


def test_ai_gc_inactive_key():
    rl._ai_counts.clear()
    rl._ai_counts["ai:2"].append(time.time() - rl._AI_WINDOW - 1)
    assert "ai:2" in rl._ai_counts
    assert rl.is_ai_rate_limited(2) is False
    assert "ai:2" not in rl._ai_counts
