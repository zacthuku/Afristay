import redis

redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)


def blacklist_token(token: str):
    redis_client.setex(f"blacklist:{token}", 3600, "true")


def is_token_blacklisted(token: str):
    return redis_client.exists(f"blacklist:{token}")