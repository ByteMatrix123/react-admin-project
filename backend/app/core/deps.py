"""
Dependency injection for FastAPI.
"""
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.redis import get_cache_manager, CacheManager
from app.core.security import verify_token
from app.models.user import User
from app.services.user import UserService

# Security scheme
security = HTTPBearer()


async def get_db() -> AsyncSession:
    """Get database session dependency."""
    async for session in get_async_session():
        yield session


async def get_cache() -> CacheManager:
    """Get cache manager dependency."""
    return await get_cache_manager()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> int:
    """Get current user ID from JWT token."""
    token = credentials.credentials
    user_id = verify_token(token, "access")
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        return int(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current user from database."""
    user_service = UserService(db)
    user = await user_service.get_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current superuser."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user


def require_permission(permission: str):
    """Dependency factory for permission checking."""
    async def check_permission(
        current_user: User = Depends(get_current_user)
    ) -> User:
        if not current_user.is_superuser and not current_user.has_permission(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' required"
            )
        return current_user
    
    return check_permission


def require_role(role: str):
    """Dependency factory for role checking."""
    async def check_role(
        current_user: User = Depends(get_current_user)
    ) -> User:
        if not current_user.is_superuser and not current_user.has_role(role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role}' required"
            )
        return current_user
    
    return check_role


# Common permission dependencies
require_user_read = require_permission("user:read")
require_user_write = require_permission("user:write")
require_user_delete = require_permission("user:delete")
require_role_read = require_permission("role:read")
require_role_write = require_permission("role:write")
require_role_delete = require_permission("role:delete")
require_permission_read = require_permission("permission:read")
require_permission_write = require_permission("permission:write")


# Optional authentication (for public endpoints that can benefit from user context)
async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Get current user optionally (for public endpoints)."""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        user_id = verify_token(token, "access")
        
        if user_id is None:
            return None
        
        user_service = UserService(db)
        user = await user_service.get_by_id(int(user_id))
        
        if not user or not user.is_active:
            return None
        
        return user
    except Exception:
        return None 
