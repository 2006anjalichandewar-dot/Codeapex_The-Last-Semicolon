from __future__ import annotations

import json
import time
from typing import Any, Optional

try:
    import redis
except Exception:  # pragma: no cover
    redis = None


class Cache:
    def __init__(self, redis_url: Optional[str] = None):
        self._redis_url = redis_url
        self._client = None
        self._memory: dict[str, tuple[float, str]] = {}

        if redis and redis_url:
            try:
                self._client = redis.Redis.from_url(redis_url, decode_responses=True)
                self._client.ping()
            except Exception:
                self._client = None

    def get(self, key: str) -> Any | None:
        if self._client:
            raw = self._client.get(key)
            return json.loads(raw) if raw else None

        now = time.time()
        item = self._memory.get(key)
        if not item:
            return None
        expires_at, raw = item
        if expires_at < now:
            self._memory.pop(key, None)
            return None
        return json.loads(raw)

    def set(self, key: str, value: Any, ttl_seconds: int = 60) -> None:
        raw = json.dumps(value)
        if self._client:
            self._client.setex(key, ttl_seconds, raw)
            return
        self._memory[key] = (time.time() + ttl_seconds, raw)

    def delete(self, key: str) -> None:
        if self._client:
            self._client.delete(key)
            return
        self._memory.pop(key, None)
