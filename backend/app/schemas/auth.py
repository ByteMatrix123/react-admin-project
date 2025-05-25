"""
Authentication Pydantic schemas.
"""
from typing import Optional
from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data schema."""
    username: Optional[str] = None


class RefreshToken(BaseModel):
    """Refresh token request schema."""
    refresh_token: str


class LoginResponse(BaseModel):
    """Login response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: dict  # User information


class UserLogin(BaseModel):
    """User login schema."""
    username: str  # Can be username or email
    password: str
    remember_me: bool = False


class UserRegister(BaseModel):
    """User registration schema."""
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    department: Optional[str] = None


class PasswordChange(BaseModel):
    """Password change schema."""
    current_password: str
    new_password: str


class PasswordReset(BaseModel):
    """Password reset schema."""
    token: str
    new_password: str


class PasswordResetRequest(BaseModel):
    """Password reset request schema."""
    email: EmailStr


class EmailVerification(BaseModel):
    """Email verification schema."""
    token: str 
