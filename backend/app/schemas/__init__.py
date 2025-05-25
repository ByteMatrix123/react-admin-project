"""
Pydantic schemas for request/response models.
"""

from .auth import (
    EmailVerification,
    LoginResponse,
    PasswordResetRequest,
    RefreshToken,
    Token,
    TokenData,
)
from .common import ErrorResponse, HealthCheck, Message, PaginatedResponse
from .permission import (
    PermissionBase,
    PermissionCreate,
    PermissionResponse,
    PermissionUpdate,
)
from .role import RoleBase, RoleCreate, RolePermissionAssign, RoleResponse, RoleUpdate
from .user import (
    PasswordChange,
    PasswordReset,
    UserBase,
    UserCreate,
    UserInDB,
    UserLogin,
    UserProfile,
    UserRegister,
    UserResponse,
    UserSettings,
    UserUpdate,
)

__all__ = [
    # User schemas
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserInDB",
    "UserResponse",
    "UserLogin",
    "UserRegister",
    "UserProfile",
    "UserSettings",
    "PasswordChange",
    "PasswordReset",
    # Auth schemas
    "Token",
    "TokenData",
    "RefreshToken",
    "LoginResponse",
    "PasswordResetRequest",
    "EmailVerification",
    # Role schemas
    "RoleBase",
    "RoleCreate",
    "RoleUpdate",
    "RoleResponse",
    "RolePermissionAssign",
    # Permission schemas
    "PermissionBase",
    "PermissionCreate",
    "PermissionUpdate",
    "PermissionResponse",
    # Common schemas
    "Message",
    "ErrorResponse",
    "PaginatedResponse",
    "HealthCheck",
]
