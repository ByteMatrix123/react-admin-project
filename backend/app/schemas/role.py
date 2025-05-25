"""
Role Pydantic schemas.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class RoleBase(BaseModel):
    """Base role schema."""

    name: str = Field(..., min_length=1, max_length=50)
    display_name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    is_active: bool = True


class RoleCreate(RoleBase):
    """Role creation schema."""

    pass


class RoleUpdate(BaseModel):
    """Role update schema."""

    name: str | None = Field(None, min_length=1, max_length=50)
    display_name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    is_active: bool | None = None


class PermissionInRole(BaseModel):
    """Permission schema for role response."""

    id: int
    name: str
    display_name: str
    description: str | None = None
    resource: str
    action: str
    is_active: bool

    model_config = {"from_attributes": True}


class RoleResponse(RoleBase):
    """Role response schema."""

    id: int
    is_system: bool
    created_at: datetime
    updated_at: datetime
    permissions: list[PermissionInRole] = []

    model_config = {"from_attributes": True}


class RolePermissionAssign(BaseModel):
    """Role permission assignment schema."""

    permission_id: int
