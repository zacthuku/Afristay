import redis
from redis.exceptions import ConnectionError as RedisConnectionError
from app.core.config import settings

# Initialize Redis client only if REDIS_URL is provided
redis_client = None
if settings.REDIS_URL:
    try:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    except Exception:
        redis_client = None


def blacklist_token(token: str):
    if not redis_client:
        return  # Skip if Redis not available
    try:
        redis_client.setex(f"blacklist:{token}", 3600, "true")
    except RedisConnectionError:
        return


def is_token_blacklisted(token: str):
    if not redis_client:
        return False  # Not blacklisted if Redis not available
    try:
        return redis_client.exists(f"blacklist:{token}")
    except RedisConnectionError:
        return False