"""
Authentication Pydantic schemas.
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class Token(BaseModel):
    """Token response schema."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data schema."""

    username: str | None = None


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

    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str | None = Field(None, max_length=100)
    department: str | None = Field(None, max_length=100)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class PasswordChange(BaseModel):
    """Password change schema."""

    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v):
        """Validate new password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class PasswordReset(BaseModel):
    """Password reset schema."""

    token: str
    new_password: str = Field(..., min_length=8, max_length=100)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v):
        """Validate new password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class PasswordResetRequest(BaseModel):
    """Password reset request schema."""

    email: EmailStr


class EmailVerification(BaseModel):
    """Email verification schema."""

    token: str


class RoleInfo(BaseModel):
    """Role information for auth user."""

    id: int
    name: str
    display_name: str
    description: str | None = None

    model_config = {"from_attributes": True}


class AuthUser(BaseModel):
    """Current authenticated user information."""

    # Basic Information
    id: int
    username: str
    email: str

    # Profile Information
    full_name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None

    # Work Information
    department: str | None = None
    position: str | None = None
    employee_id: str | None = None

    # Personal Information
    birthday: datetime | None = None
    location: str | None = None
    bio: str | None = None

    # Status and Settings
    is_active: bool
    is_verified: bool
    is_superuser: bool

    # Authentication
    last_login: datetime | None = None
    password_changed_at: datetime | None = None

    # Settings
    language: str = "zh-CN"
    timezone: str = "Asia/Shanghai"
    theme: str = "light"

    # Notification Settings
    email_notifications: bool = True
    browser_notifications: bool = True
    mobile_notifications: bool = True

    # Privacy Settings
    show_online_status: bool = True
    allow_data_collection: bool = False

    # Security Settings
    two_factor_enabled: bool = False
    session_timeout: int = 60

    # Timestamps
    created_at: datetime
    updated_at: datetime

    # Relationships
    roles: list[RoleInfo] = []
    permissions: list[str] = []

    model_config = {"from_attributes": True}

    @classmethod
    def from_user(cls, user) -> "AuthUser":
        """Create AuthUser from User model."""
        # Extract all permissions from user's roles
        permissions = set()
        for role in user.roles:
            for permission in role.permissions:
                permissions.add(permission.name)

        return cls(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            avatar_url=user.avatar_url,
            department=user.department,
            position=user.position,
            employee_id=user.employee_id,
            birthday=user.birthday,
            location=user.location,
            bio=user.bio,
            is_active=user.is_active,
            is_verified=user.is_verified,
            is_superuser=user.is_superuser,
            last_login=user.last_login,
            password_changed_at=user.password_changed_at,
            language=user.language,
            timezone=user.timezone,
            theme=user.theme,
            email_notifications=user.email_notifications,
            browser_notifications=user.browser_notifications,
            mobile_notifications=user.mobile_notifications,
            show_online_status=user.show_online_status,
            allow_data_collection=user.allow_data_collection,
            two_factor_enabled=user.two_factor_enabled,
            session_timeout=user.session_timeout,
            created_at=user.created_at,
            updated_at=user.updated_at,
            roles=[RoleInfo.model_validate(role) for role in user.roles],
            permissions=list(permissions),
        )
