"""
Role service for business logic.
"""

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import Permission, Role


class RoleService:
    """Role service for business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, role_id: int) -> Role | None:
        """Get role by ID."""
        result = await self.db.execute(
            select(Role)
            .options(selectinload(Role.permissions))
            .where(Role.id == role_id)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Role | None:
        """Get role by name."""
        result = await self.db.execute(
            select(Role)
            .options(selectinload(Role.permissions))
            .where(Role.name == name)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        is_active: bool | None = None,
    ) -> tuple[list[Role], int]:
        """Get all roles with pagination and filters."""
        query = select(Role).options(selectinload(Role.permissions))

        # Apply filters
        conditions = []

        if search:
            search_term = f"%{search}%"
            conditions.append(
                or_(
                    Role.name.ilike(search_term),
                    Role.display_name.ilike(search_term),
                    Role.description.ilike(search_term),
                )
            )

        if is_active is not None:
            conditions.append(Role.is_active == is_active)

        if conditions:
            query = query.where(and_(*conditions))

        # Get total count
        count_query = select(func.count(Role.id))
        if conditions:
            count_query = count_query.where(and_(*conditions))

        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Get paginated results
        query = query.offset(skip).limit(limit).order_by(Role.created_at.desc())
        result = await self.db.execute(query)
        roles = result.scalars().all()

        return list(roles), total

    async def create(self, role_data: dict) -> Role:
        """Create new role."""
        role = Role(**role_data)
        self.db.add(role)
        await self.db.commit()
        await self.db.refresh(role)
        return role

    async def update(self, role_id: int, role_data: dict) -> Role | None:
        """Update role."""
        role = await self.get_by_id(role_id)
        if not role:
            return None

        # Update fields
        for field, value in role_data.items():
            if hasattr(role, field):
                setattr(role, field, value)

        await self.db.commit()
        await self.db.refresh(role)
        return role

    async def delete(self, role_id: int) -> bool:
        """Delete role."""
        role = await self.get_by_id(role_id)
        if not role:
            return False

        # Don't delete system roles
        if role.is_system:
            return False

        await self.db.delete(role)
        await self.db.commit()
        return True

    async def assign_permission(self, role_id: int, permission_id: int) -> bool:
        """Assign permission to role."""
        role = await self.get_by_id(role_id)
        if not role:
            return False

        # Get permission
        permission_result = await self.db.execute(
            select(Permission).where(Permission.id == permission_id)
        )
        permission = permission_result.scalar_one_or_none()
        if not permission:
            return False

        # Check if role already has this permission
        if permission not in role.permissions:
            role.permissions.append(permission)
            await self.db.commit()

        return True

    async def remove_permission(self, role_id: int, permission_id: int) -> bool:
        """Remove permission from role."""
        role = await self.get_by_id(role_id)
        if not role:
            return False

        # Get permission
        permission_result = await self.db.execute(
            select(Permission).where(Permission.id == permission_id)
        )
        permission = permission_result.scalar_one_or_none()
        if not permission:
            return False

        # Remove permission if role has it
        if permission in role.permissions:
            role.permissions.remove(permission)
            await self.db.commit()

        return True

    async def name_exists(self, name: str, exclude_role_id: int | None = None) -> bool:
        """Check if role name exists."""
        query = select(Role.id).where(Role.name == name)
        if exclude_role_id:
            query = query.where(Role.id != exclude_role_id)

        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None
