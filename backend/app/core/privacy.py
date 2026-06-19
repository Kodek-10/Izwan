import os


def _env_flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


AIR_GAPPED_FORCED = _env_flag("IZWAN_AIR_GAPPED", False)
_runtime_air_gapped = AIR_GAPPED_FORCED


def is_air_gapped() -> bool:
    return AIR_GAPPED_FORCED or _runtime_air_gapped


def set_air_gapped(enabled: bool) -> bool:
    global _runtime_air_gapped
    _runtime_air_gapped = AIR_GAPPED_FORCED or enabled
    return is_air_gapped()
