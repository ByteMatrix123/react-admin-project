"""
User Pydantic schemas.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserBase(BaseModel):
    """Base user schema."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=100)
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=20)
    department: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    employee_id: Optional[str] = Field(None, max_length=50)
    is_active: bool = True


class UserCreate(UserBase):
    """User creation schema."""
    password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserUpdate(BaseModel):
    """User update schema."""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, max_length=100)
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=20)
    department: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    employee_id: Optional[str] = Field(None, max_length=50)
    birthday: Optional[datetime] = None
    location: Optional[str] = Field(None, max_length=200)
    bio: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class UserProfile(BaseModel):
    """User profile schema for personal information."""
    full_name: Optional[str] = Field(None, max_length=100)
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=20)
    birthday: Optional[datetime] = None
    location: Optional[str] = Field(None, max_length=200)
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class UserSettings(BaseModel):
    """User settings schema."""
    language: str = Field(default="zh-CN", max_length=10)
    timezone: str = Field(default="Asia/Shanghai", max_length=50)
    theme: str = Field(default="light", max_length=20)
    email_notifications: bool = True
    browser_notifications: bool = True
    mobile_notifications: bool = True
    show_online_status: bool = True
    allow_data_collection: bool = False
    two_factor_enabled: bool = False
    session_timeout: int = Field(default=60, ge=5, le=480)  # 5 minutes to 8 hours


class UserInDB(UserBase):
    """User schema for database operations."""
    id: int
    hashed_password: str
    avatar_url: Optional[str] = None
    birthday: Optional[datetime] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    is_verified: bool = False
    is_superuser: bool = False
    last_login: Optional[datetime] = None
    password_changed_at: Optional[datetime] = None
    language: str = "zh-CN"
    timezone: str = "Asia/Shanghai"
    theme: str = "light"
    email_notifications: bool = True
    browser_notifications: bool = True
    mobile_notifications: bool = True
    show_online_status: bool = True
    allow_data_collection: bool = False
    two_factor_enabled: bool = False
    session_timeout: int = 60
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    """User response schema (public information)."""
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    employee_id: Optional[str] = None
    birthday: Optional[datetime] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_superuser: bool
    last_login: Optional[datetime] = None
    language: str
    timezone: str
    theme: str
    created_at: datetime
    updated_at: datetime
    roles: List[dict] = []
    
    @field_validator('roles', mode='before')
    @classmethod
    def convert_roles(cls, v):
        """Convert Role objects to dictionaries."""
        if isinstance(v, list):
            result = []
            for role in v:
                if hasattr(role, '__dict__'):
                    # Convert SQLAlchemy model to dict
                    role_dict = {
                        'id': role.id,
                        'name': role.name,
                        'display_name': role.display_name,
                        'description': role.description,
                        'is_active': role.is_active,
                        'is_system': role.is_system
                    }
                    result.append(role_dict)
                elif isinstance(role, dict):
                    result.append(role)
            return result
        return v
    
    model_config = {"from_attributes": True}
    
    @property
    def display_name(self) -> str:
        """Get display name for user."""
        if self.full_name:
            return self.full_name
        elif self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        else:
            return self.username


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
    full_name: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class PasswordChange(BaseModel):
    """Password change schema."""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v):
        """Validate new password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class PasswordReset(BaseModel):
    """Password reset schema."""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v):
        """Validate new password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v 
