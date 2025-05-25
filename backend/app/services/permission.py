"""
Permission service for business logic.
"""

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import Permission


class PermissionService:
    """Permission service for business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, permission_id: int) -> Permission | None:
        """Get permission by ID."""
        result = await self.db.execute(
            select(Permission).where(Permission.id == permission_id)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Permission | None:
        """Get permission by name."""
        result = await self.db.execute(
            select(Permission).where(Permission.name == name)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        resource: str | None = None,
        action: str | None = None,
        is_active: bool | None = None,
    ) -> tuple[list[Permission], int]:
        """Get all permissions with pagination and filters."""
        query = select(Permission)

        # Apply filters
        conditions = []

        if search:
            search_term = f"%{search}%"
            conditions.append(
                or_(
                    Permission.name.ilike(search_term),
                    Permission.display_name.ilike(search_term),
                    Permission.description.ilike(search_term),
                    Permission.resource.ilike(search_term),
                    Permission.action.ilike(search_term),
                )
            )

        if resource:
            conditions.append(Permission.resource == resource)

        if action:
            conditions.append(Permission.action == action)

        if is_active is not None:
            conditions.append(Permission.is_active == is_active)

        if conditions:
            query = query.where(and_(*conditions))

        # Get total count
        count_query = select(func.count(Permission.id))
        if conditions:
            count_query = count_query.where(and_(*conditions))

        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Get paginated results
        query = (
            query.offset(skip)
            .limit(limit)
            .order_by(Permission.resource, Permission.action)
        )
        result = await self.db.execute(query)
        permissions = result.scalars().all()

        return list(permissions), total

    async def create(self, permission_data: dict) -> Permission:
        """Create new permission."""
        permission = Permission(**permission_data)
        self.db.add(permission)
        await self.db.commit()
        await self.db.refresh(permission)
        return permission

    async def update(
        self, permission_id: int, permission_data: dict
    ) -> Permission | None:
        """Update permission."""
        permission = await self.get_by_id(permission_id)
        if not permission:
            return None

        # Update fields
        for field, value in permission_data.items():
            if hasattr(permission, field):
                setattr(permission, field, value)

        await self.db.commit()
        await self.db.refresh(permission)
        return permission

    async def delete(self, permission_id: int) -> bool:
        """Delete permission."""
        permission = await self.get_by_id(permission_id)
        if not permission:
            return False

        await self.db.delete(permission)
        await self.db.commit()
        return True

    async def name_exists(
        self, name: str, exclude_permission_id: int | None = None
    ) -> bool:
        """Check if permission name exists."""
        query = select(Permission.id).where(Permission.name == name)
        if exclude_permission_id:
            query = query.where(Permission.id != exclude_permission_id)

        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None

    async def resource_action_exists(
        self, resource: str, action: str, exclude_permission_id: int | None = None
    ) -> bool:
        """Check if resource-action combination exists."""
        query = select(Permission.id).where(
            and_(Permission.resource == resource, Permission.action == action)
        )
        if exclude_permission_id:
            query = query.where(Permission.id != exclude_permission_id)

        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None

    async def get_by_resource(self, resource: str) -> list[Permission]:
        """Get all permissions for a specific resource."""
        result = await self.db.execute(
            select(Permission)
            .where(Permission.resource == resource)
            .order_by(Permission.action)
        )
        return list(result.scalars().all())

    async def get_resources(self) -> list[str]:
        """Get all unique resources."""
        result = await self.db.execute(
            select(Permission.resource).distinct().order_by(Permission.resource)
        )
        return list(result.scalars().all())

    async def get_actions(self) -> list[str]:
        """Get all unique actions."""
        result = await self.db.execute(
            select(Permission.action).distinct().order_by(Permission.action)
        )
        return list(result.scalars().all())
