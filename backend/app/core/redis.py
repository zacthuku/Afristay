import redis
from redis.exceptions import ConnectionError as RedisConnectionError

redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)


def blacklist_token(token: str):
    try:
        redis_client.setex(f"blacklist:{token}", 3600, "true")
    except RedisConnectionError:
        # Redis is optional in local development
        return


def is_token_blacklisted(token: str):
    try:
        return redis_client.exists(f"blacklist:{token}")
    except RedisConnectionError:
        return False