"""
Role management API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_permission
from app.models.user import User
from app.schemas.role import RoleCreate, RoleResponse, RoleUpdate
from app.services.role import RoleService

router = APIRouter()


@router.get("/", response_model=list[RoleResponse])
async def get_roles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("role:read")),
):
    """Get all roles with pagination and search."""
    role_service = RoleService(db)
    roles, total = await role_service.get_all(skip=skip, limit=limit, search=search)
    return roles


@router.get("/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("role:read")),
):
    """Get role by ID."""
    role_service = RoleService(db)
    role = await role_service.get_by_id(role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
        )
    return role


@router.post("/", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: RoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("role:create")),
):
    """Create a new role."""
    role_service = RoleService(db)

    # Check if role name already exists
    existing_role = await role_service.get_by_name(role_data.name)
    if existing_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Role name already exists"
        )

    role = await role_service.create(role_data.model_dump())
    return role


@router.put("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    role_data: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("role:update")),
):
    """Update role by ID."""
    role_service = RoleService(db)

    # Check if role exists
    existing_role = await role_service.get_by_id(role_id)
    if not existing_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
        )

    # Check if new name conflicts with existing role
    if role_data.name and role_data.name != existing_role.name:
        name_conflict = await role_service.get_by_name(role_data.name)
        if name_conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role name already exists",
            )

    role = await role_service.update(role_id, role_data.model_dump(exclude_unset=True))
    return role


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("role:delete")),
):
    """Delete role by ID."""
    role_service = RoleService(db)

    # Check if role exists
    existing_role = await role_service.get_by_id(role_id)
    if not existing_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
        )

    # Check if role is system role (cannot be deleted)
    if existing_role.name in ["super_admin", "admin", "user"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="System roles cannot be deleted",
        )

    await role_service.delete(role_id)


@router.post("/{role_id}/permissions/{permission_id}", response_model=RoleResponse)
async def assign_permission_to_role(
    role_id: int,
    permission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("role:update")),
):
    """Assign permission to role."""
    role_service = RoleService(db)

    success = await role_service.assign_permission(role_id, permission_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role or permission not found"
        )

    role = await role_service.get_by_id(role_id)
    return role


@router.delete("/{role_id}/permissions/{permission_id}", response_model=RoleResponse)
async def remove_permission_from_role(
    role_id: int,
    permission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("role:update")),
):
    """Remove permission from role."""
    role_service = RoleService(db)

    success = await role_service.remove_permission(role_id, permission_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role or permission not found"
        )

    role = await role_service.get_by_id(role_id)
    return role
