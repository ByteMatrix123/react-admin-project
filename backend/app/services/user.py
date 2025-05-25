"""
User service for business logic.
"""

from datetime import datetime

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import get_password_hash, verify_password
from app.models.user import Role, User
from app.schemas.user import UserCreate, UserProfile, UserSettings, UserUpdate


class UserService:
    """User service for business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: int) -> User | None:
        """Get user by ID."""
        result = await self.db.execute(
            select(User).options(selectinload(User.roles)).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        """Get user by username."""
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.roles))
            .where(User.username == username)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        """Get user by email."""
        result = await self.db.execute(
            select(User).options(selectinload(User.roles)).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_username_or_email(self, identifier: str) -> User | None:
        """Get user by username or email."""
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.roles))
            .where(or_(User.username == identifier, User.email == identifier))
        )
        return result.scalar_one_or_none()

    async def create(self, user_data: UserCreate) -> User:
        """Create new user."""
        # Hash password
        hashed_password = get_password_hash(user_data.password)

        # Create user instance
        user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            department=user_data.department,
            position=user_data.position,
            employee_id=user_data.employee_id,
            is_active=user_data.is_active,
        )

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def update(self, user_id: int, user_data: UserUpdate) -> User | None:
        """Update user."""
        user = await self.get_by_id(user_id)
        if not user:
            return None

        # Update fields
        update_data = user_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def update_profile(
        self, user_id: int, profile_data: UserProfile
    ) -> User | None:
        """Update user profile."""
        user = await self.get_by_id(user_id)
        if not user:
            return None

        # Update profile fields
        update_data = profile_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def update_settings(
        self, user_id: int, settings_data: UserSettings
    ) -> User | None:
        """Update user settings."""
        user = await self.get_by_id(user_id)
        if not user:
            return None

        # Update settings fields
        update_data = settings_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def change_password(
        self, user_id: int, current_password: str, new_password: str
    ) -> bool:
        """Change user password."""
        user = await self.get_by_id(user_id)
        if not user:
            return False

        # Verify current password
        if not verify_password(current_password, user.hashed_password):
            return False

        # Update password
        user.hashed_password = get_password_hash(new_password)
        user.password_changed_at = datetime.utcnow()

        await self.db.commit()
        return True

    async def reset_password(self, user_id: int, new_password: str) -> bool:
        """Reset user password (admin function)."""
        user = await self.get_by_id(user_id)
        if not user:
            return False

        # Update password
        user.hashed_password = get_password_hash(new_password)
        user.password_changed_at = datetime.utcnow()

        await self.db.commit()
        return True

    async def delete(self, user_id: int) -> bool:
        """Delete user."""
        user = await self.get_by_id(user_id)
        if not user:
            return False

        await self.db.delete(user)
        await self.db.commit()
        return True

    async def deactivate(self, user_id: int) -> bool:
        """Deactivate user."""
        user = await self.get_by_id(user_id)
        if not user:
            return False

        user.is_active = False
        await self.db.commit()
        return True

    async def activate(self, user_id: int) -> bool:
        """Activate user."""
        user = await self.get_by_id(user_id)
        if not user:
            return False

        user.is_active = True
        await self.db.commit()
        return True

    async def update_last_login(self, user_id: int) -> None:
        """Update user's last login time."""
        user = await self.get_by_id(user_id)
        if user:
            user.last_login = datetime.utcnow()
            await self.db.commit()

    async def get_users(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        department: str | None = None,
        is_active: bool | None = None,
    ) -> tuple[list[User], int]:
        """Get users with pagination and filters."""
        query = select(User).options(selectinload(User.roles))

        # Apply filters
        conditions = []

        if search:
            search_term = f"%{search}%"
            conditions.append(
                or_(
                    User.username.ilike(search_term),
                    User.email.ilike(search_term),
                    User.full_name.ilike(search_term),
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                )
            )

        if department:
            conditions.append(User.department == department)

        if is_active is not None:
            conditions.append(User.is_active == is_active)

        if conditions:
            query = query.where(and_(*conditions))

        # Get total count
        count_query = select(func.count(User.id))
        if conditions:
            count_query = count_query.where(and_(*conditions))

        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Get paginated results
        query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
        result = await self.db.execute(query)
        users = result.scalars().all()

        return list(users), total

    async def assign_role(self, user_id: int, role_id: int) -> bool:
        """Assign role to user."""
        user = await self.get_by_id(user_id)
        if not user:
            return False

        # Get role
        role_result = await self.db.execute(select(Role).where(Role.id == role_id))
        role = role_result.scalar_one_or_none()
        if not role:
            return False

        # Check if user already has this role
        if role not in user.roles:
            user.roles.append(role)
            await self.db.commit()

        return True

    async def remove_role(self, user_id: int, role_id: int) -> bool:
        """Remove role from user."""
        user = await self.get_by_id(user_id)
        if not user:
            return False

        # Get role
        role_result = await self.db.execute(select(Role).where(Role.id == role_id))
        role = role_result.scalar_one_or_none()
        if not role:
            return False

        # Remove role if user has it
        if role in user.roles:
            user.roles.remove(role)
            await self.db.commit()

        return True

    async def username_exists(
        self, username: str, exclude_user_id: int | None = None
    ) -> bool:
        """Check if username exists."""
        query = select(User.id).where(User.username == username)
        if exclude_user_id:
            query = query.where(User.id != exclude_user_id)

        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None

    async def email_exists(
        self, email: str, exclude_user_id: int | None = None
    ) -> bool:
        """Check if email exists."""
        query = select(User.id).where(User.email == email)
        if exclude_user_id:
            query = query.where(User.id != exclude_user_id)

        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None
