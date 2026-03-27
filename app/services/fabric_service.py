from __future__ import annotations

import logging
from typing import Any

import requests

from app.core.config import settings

logger = logging.getLogger("app.fabric")


def is_enabled() -> bool:
    return bool(settings.fabric_enabled)


def submit_audit_log(payload: dict[str, Any]) -> None:
    if not is_enabled():
        return
    try:
        requests.post(
            f"{settings.fabric_gateway_url}/logs",
            json=payload,
            timeout=settings.fabric_timeout_seconds,
        )
    except Exception as exc:
        logger.warning("Fabric gateway submit failed: %s", exc)
