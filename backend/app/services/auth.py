"""
Authentication service for business logic.
"""

from datetime import timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    generate_password_reset_token,
    verify_password,
    verify_password_reset_token,
    verify_token,
)
from app.models.user import User
from app.schemas.auth import LoginResponse
from app.services.user import UserService


class AuthService:
    """Authentication service for business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_service = UserService(db)

    async def authenticate_user(self, username: str, password: str) -> User | None:
        """Authenticate user with username/email and password."""
        user = await self.user_service.get_by_username_or_email(username)

        if not user:
            return None

        if not verify_password(password, user.hashed_password):
            return None

        if not user.is_active:
            return None

        return user

    async def login(
        self, username: str, password: str, remember_me: bool = False
    ) -> LoginResponse | None:
        """Login user and return tokens."""
        user = await self.authenticate_user(username, password)

        if not user:
            return None

        # Update last login
        await self.user_service.update_last_login(user.id)

        # Create tokens
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        refresh_token_expires = timedelta(days=settings.refresh_token_expire_days)

        # Extend token expiry if remember me is checked
        if remember_me:
            access_token_expires = timedelta(hours=24)  # 24 hours
            refresh_token_expires = timedelta(days=30)  # 30 days

        access_token = create_access_token(
            subject=user.id, expires_delta=access_token_expires
        )

        refresh_token = create_refresh_token(
            subject=user.id, expires_delta=refresh_token_expires
        )

        # Prepare user data for response
        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "is_superuser": user.is_superuser,
            "roles": [
                {"id": role.id, "name": role.name, "display_name": role.display_name}
                for role in user.roles
            ],
        }

        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=int(access_token_expires.total_seconds()),
            user=user_data,
        )

    async def refresh_token(self, refresh_token: str) -> dict | None:
        """Refresh access token using refresh token."""
        user_id = verify_token(refresh_token, "refresh")

        if not user_id:
            return None

        user = await self.user_service.get_by_id(int(user_id))

        if not user or not user.is_active:
            return None

        # Create new access token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            subject=user.id, expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": int(access_token_expires.total_seconds()),
        }

    async def register(self, user_data: dict) -> User | None:
        """Register new user."""
        # Check if username or email already exists
        if await self.user_service.username_exists(user_data["username"]):
            return None

        if await self.user_service.email_exists(user_data["email"]):
            return None

        # Create user
        from app.schemas.user import UserCreate

        user_create = UserCreate(**user_data)
        user = await self.user_service.create(user_create)

        return user

    async def request_password_reset(self, email: str) -> str | None:
        """Request password reset token."""
        user = await self.user_service.get_by_email(email)

        if not user:
            return None

        # Generate password reset token
        reset_token = generate_password_reset_token(email)

        # TODO: Send email with reset token
        # For now, just return the token
        return reset_token

    async def reset_password(self, token: str, new_password: str) -> bool:
        """Reset password using token."""
        email = verify_password_reset_token(token)

        if not email:
            return False

        user = await self.user_service.get_by_email(email)

        if not user:
            return False

        # Reset password
        return await self.user_service.reset_password(user.id, new_password)

    async def verify_token_and_get_user(self, token: str) -> User | None:
        """Verify token and return user."""
        user_id = verify_token(token, "access")

        if not user_id:
            return None

        user = await self.user_service.get_by_id(int(user_id))

        if not user or not user.is_active:
            return None

        return user
