"""
Authentication API routes.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import (
    AuthUser,
    LoginResponse,
    PasswordReset,
    PasswordResetRequest,
    RefreshToken,
    UserLogin,
    UserRegister,
)
from app.schemas.common import Message
from app.services.auth import AuthService

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(user_credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """User login."""
    auth_service = AuthService(db)

    login_result = await auth_service.login(
        username=user_credentials.username,
        password=user_credentials.password,
        remember_me=user_credentials.remember_me,
    )

    if not login_result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return login_result


@router.post("/register", response_model=Message)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """User registration."""
    auth_service = AuthService(db)

    user = await auth_service.register(user_data.model_dump())

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists",
        )

    return Message(message="User registered successfully")


@router.post("/refresh", response_model=dict)
async def refresh_token(refresh_data: RefreshToken, db: AsyncSession = Depends(get_db)):
    """Refresh access token."""
    auth_service = AuthService(db)

    token_data = await auth_service.refresh_token(refresh_data.refresh_token)

    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token_data


@router.post("/logout", response_model=Message)
async def logout(current_user: User = Depends(get_current_user)):
    """User logout."""
    # TODO: Implement token blacklisting if needed
    return Message(message="Logged out successfully")


@router.post("/password-reset-request", response_model=Message)
async def request_password_reset(
    reset_request: PasswordResetRequest, db: AsyncSession = Depends(get_db)
):
    """Request password reset."""
    auth_service = AuthService(db)

    await auth_service.request_password_reset(reset_request.email)

    # Always return success message for security reasons
    # Don't reveal if email exists or not
    return Message(message="If the email exists, a password reset link has been sent")


@router.post("/password-reset", response_model=Message)
async def reset_password(reset_data: PasswordReset, db: AsyncSession = Depends(get_db)):
    """Reset password using token."""
    auth_service = AuthService(db)

    success = await auth_service.reset_password(
        token=reset_data.token, new_password=reset_data.new_password
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    return Message(message="Password reset successfully")


@router.get("/me", response_model=AuthUser)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return AuthUser.from_user(current_user)
