from app.core.cache import Cache
from app.core.config import settings

cache = Cache(settings.redis_url)
