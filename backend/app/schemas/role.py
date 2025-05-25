"""
Role Pydantic schemas.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class RoleBase(BaseModel):
    """Base role schema."""
    name: str = Field(..., min_length=1, max_length=50)
    display_name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: bool = True


class RoleCreate(RoleBase):
    """Role creation schema."""
    pass


class RoleUpdate(BaseModel):
    """Role update schema."""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class RoleResponse(RoleBase):
    """Role response schema."""
    id: int
    is_system: bool
    created_at: datetime
    updated_at: datetime
    permissions: List[dict] = []
    
    model_config = {"from_attributes": True}


class RolePermissionAssign(BaseModel):
    """Role permission assignment schema."""
    permission_id: int 
