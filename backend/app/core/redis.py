"""
Redis connection and cache management.
"""
import json
from typing import Any, Optional, Union
import redis.asyncio as redis
from app.core.config import settings

# Global Redis connection
redis_client: Optional[redis.Redis] = None


async def init_redis() -> None:
    """Initialize Redis connection."""
    global redis_client
    redis_client = redis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
        retry_on_timeout=True,
        health_check_interval=30,
    )


async def close_redis() -> None:
    """Close Redis connection."""
    global redis_client
    if redis_client:
        await redis_client.close()


async def get_redis() -> redis.Redis:
    """Get Redis client."""
    if not redis_client:
        await init_redis()
    return redis_client


class CacheManager:
    """Redis cache manager."""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        try:
            value = await self.redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception:
            return None
    
    async def set(
        self,
        key: str,
        value: Any,
        expire: Optional[int] = None
    ) -> bool:
        """Set value in cache."""
        try:
            serialized_value = json.dumps(value, default=str)
            if expire:
                return await self.redis.setex(key, expire, serialized_value)
            else:
                return await self.redis.set(key, serialized_value)
        except Exception:
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        try:
            return bool(await self.redis.delete(key))
        except Exception:
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        try:
            return bool(await self.redis.exists(key))
        except Exception:
            return False
    
    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration for key."""
        try:
            return bool(await self.redis.expire(key, seconds))
        except Exception:
            return False
    
    async def ttl(self, key: str) -> int:
        """Get time to live for key."""
        try:
            return await self.redis.ttl(key)
        except Exception:
            return -1
    
    async def flush_all(self) -> bool:
        """Flush all cache."""
        try:
            await self.redis.flushall()
            return True
        except Exception:
            return False


async def get_cache_manager() -> CacheManager:
    """Get cache manager instance."""
    redis = await get_redis()
    return CacheManager(redis) 
