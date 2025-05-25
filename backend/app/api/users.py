"""
User management API routes.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import (
    get_db, get_current_user, get_current_superuser,
    require_user_read, require_user_write, require_user_delete
)
from app.models.user import User
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, UserProfile, UserSettings,
    PasswordChange
)
from app.schemas.common import Message, PaginatedResponse
from app.services.user import UserService

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[UserResponse])
async def get_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_user_read)
):
    """Get users with pagination and filters."""
    user_service = UserService(db)
    
    skip = (page - 1) * size
    users, total = await user_service.get_users(
        skip=skip,
        limit=size,
        search=search,
        department=department,
        is_active=is_active
    )
    
    return PaginatedResponse.create(
        items=[UserResponse.model_validate(user) for user in users],
        total=total,
        page=page,
        size=size
    )


@router.post("/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_user_write)
):
    """Create new user."""
    user_service = UserService(db)
    
    # Check if username or email already exists
    if await user_service.username_exists(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    if await user_service.email_exists(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    user = await user_service.create(user_data)
    return UserResponse.model_validate(user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_user_read)
):
    """Get user by ID."""
    user_service = UserService(db)
    user = await user_service.get_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.model_validate(user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_user_write)
):
    """Update user."""
    user_service = UserService(db)
    
    # Check if username or email already exists (excluding current user)
    if user_data.username and await user_service.username_exists(user_data.username, user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    if user_data.email and await user_service.email_exists(user_data.email, user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    user = await user_service.update(user_id, user_data)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.model_validate(user)


@router.delete("/{user_id}", response_model=Message)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_user_delete)
):
    """Delete user."""
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    
    user_service = UserService(db)
    success = await user_service.delete(user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return Message(message="User deleted successfully")


@router.post("/{user_id}/activate", response_model=Message)
async def activate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_user_write)
):
    """Activate user."""
    user_service = UserService(db)
    success = await user_service.activate(user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return Message(message="User activated successfully")


@router.post("/{user_id}/deactivate", response_model=Message)
async def deactivate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_user_write)
):
    """Deactivate user."""
    # Prevent self-deactivation
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate yourself"
        )
    
    user_service = UserService(db)
    success = await user_service.deactivate(user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return Message(message="User deactivated successfully")


@router.post("/{user_id}/roles/{role_id}", response_model=Message)
async def assign_role_to_user(
    user_id: int,
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_user_write)
):
    """Assign role to user."""
    user_service = UserService(db)
    success = await user_service.assign_role(user_id, role_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User or role not found"
        )
    
    return Message(message="Role assigned successfully")


@router.delete("/{user_id}/roles/{role_id}", response_model=Message)
async def remove_role_from_user(
    user_id: int,
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_user_write)
):
    """Remove role from user."""
    user_service = UserService(db)
    success = await user_service.remove_role(user_id, role_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User or role not found"
        )
    
    return Message(message="Role removed successfully")


# Profile management endpoints
@router.get("/me/profile", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile."""
    return UserResponse.model_validate(current_user)


@router.put("/me/profile", response_model=UserResponse)
async def update_my_profile(
    profile_data: UserProfile,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user's profile."""
    user_service = UserService(db)
    user = await user_service.update_profile(current_user.id, profile_data)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.model_validate(user)


@router.put("/me/settings", response_model=UserResponse)
async def update_my_settings(
    settings_data: UserSettings,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user's settings."""
    user_service = UserService(db)
    user = await user_service.update_settings(current_user.id, settings_data)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.model_validate(user)


@router.post("/me/change-password", response_model=Message)
async def change_my_password(
    password_data: PasswordChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Change current user's password."""
    user_service = UserService(db)
    success = await user_service.change_password(
        user_id=current_user.id,
        current_password=password_data.current_password,
        new_password=password_data.new_password
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    return Message(message="Password changed successfully") 
