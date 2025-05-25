"""
Permission Pydantic schemas.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class PermissionBase(BaseModel):
    """Base permission schema."""

    name: str = Field(..., min_length=1, max_length=100)
    display_name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    resource: str = Field(..., min_length=1, max_length=50)
    action: str = Field(..., min_length=1, max_length=50)
    is_active: bool = True


class PermissionCreate(PermissionBase):
    """Permission creation schema."""

    pass


class PermissionUpdate(BaseModel):
    """Permission update schema."""

    name: str | None = Field(None, min_length=1, max_length=100)
    display_name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    resource: str | None = Field(None, min_length=1, max_length=50)
    action: str | None = Field(None, min_length=1, max_length=50)
    is_active: bool | None = None


class PermissionResponse(PermissionBase):
    """Permission response schema."""

    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
