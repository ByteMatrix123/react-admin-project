"""
Permission management API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_permission
from app.models.user import User
from app.schemas.permission import (
    PermissionCreate,
    PermissionResponse,
    PermissionUpdate,
)
from app.services.permission import PermissionService

router = APIRouter()


@router.get("/", response_model=list[PermissionResponse])
async def get_permissions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: str | None = Query(None),
    resource: str | None = Query(None),
    action: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("permission:read")),
):
    """Get all permissions with pagination and filtering."""
    permission_service = PermissionService(db)
    permissions, total = await permission_service.get_all(
        skip=skip, limit=limit, search=search, resource=resource, action=action
    )
    return permissions


@router.get("/{permission_id}", response_model=PermissionResponse)
async def get_permission(
    permission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("permission:read")),
):
    """Get permission by ID."""
    permission_service = PermissionService(db)
    permission = await permission_service.get_by_id(permission_id)
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found"
        )
    return permission


@router.post(
    "/", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED
)
async def create_permission(
    permission_data: PermissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("permission:create")),
):
    """Create a new permission."""
    permission_service = PermissionService(db)

    # Check if permission name already exists
    existing_permission = await permission_service.get_by_name(permission_data.name)
    if existing_permission:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permission name already exists",
        )

    permission = await permission_service.create(permission_data.model_dump())
    return permission


@router.put("/{permission_id}", response_model=PermissionResponse)
async def update_permission(
    permission_id: int,
    permission_data: PermissionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("permission:update")),
):
    """Update permission by ID."""
    permission_service = PermissionService(db)

    # Check if permission exists
    existing_permission = await permission_service.get_by_id(permission_id)
    if not existing_permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found"
        )

    # Check if new name conflicts with existing permission
    if permission_data.name and permission_data.name != existing_permission.name:
        name_conflict = await permission_service.get_by_name(permission_data.name)
        if name_conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Permission name already exists",
            )

    permission = await permission_service.update(
        permission_id, permission_data.model_dump(exclude_unset=True)
    )
    return permission


@router.delete("/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_permission(
    permission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("permission:delete")),
):
    """Delete permission by ID."""
    permission_service = PermissionService(db)

    # Check if permission exists
    existing_permission = await permission_service.get_by_id(permission_id)
    if not existing_permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found"
        )

    # Check if permission is system permission (cannot be deleted)
    system_permissions = [
        "user:read",
        "user:create",
        "user:update",
        "user:delete",
        "role:read",
        "role:create",
        "role:update",
        "role:delete",
        "permission:read",
        "permission:create",
        "permission:update",
        "permission:delete",
        "system:admin",
    ]

    if existing_permission.name in system_permissions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="System permissions cannot be deleted",
        )

    await permission_service.delete(permission_id)


@router.get("/resources/", response_model=list[str])
async def get_permission_resources(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("permission:read")),
):
    """Get all unique permission resources."""
    permission_service = PermissionService(db)
    resources = await permission_service.get_resources()
    return resources


@router.get("/actions/", response_model=list[str])
async def get_permission_actions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("permission:read")),
):
    """Get all unique permission actions."""
    permission_service = PermissionService(db)
    actions = await permission_service.get_actions()
    return actions
