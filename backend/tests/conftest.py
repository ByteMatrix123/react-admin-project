"""
Pytest configuration and fixtures.
"""

import os
import sys

import httpx
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import Base
from app.core.deps import get_db
from app.models.user import User
from app.schemas.user import UserCreate
from main import app

# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:password@localhost:5432/test_enterprise_admin"

# Create test engine with NullPool to avoid connection issues
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    future=True,
    poolclass=NullPool,  # Use NullPool for testing to avoid connection pool issues
)

# Create test session factory
TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session():
    """Create a test database session."""
    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    # Create session
    async with TestSessionLocal() as session:
        try:
            yield session
        finally:
            await session.rollback()
            await session.close()

    # Clean up tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession):
    """Create a test client."""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    from app.services.user import UserService

    user_service = UserService(db_session)
    user_data = UserCreate(
        username="testuser",
        email="test@example.com",
        password="TestPass123!",
        full_name="Test User"
    )

    user = await user_service.create(user_data)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession) -> User:
    """Create an admin user with super admin role."""
    from app.schemas.user import UserCreate
    from app.services.role import RoleService
    from app.services.user import UserService

    # First ensure roles and permissions exist
    await _setup_test_roles_and_permissions(db_session)

    user_service = UserService(db_session)
    role_service = RoleService(db_session)

    user_data = UserCreate(
        username="testadmin",
        email="admin@example.com",
        password="AdminPass123!",
        full_name="Test Admin",
        is_active=True
    )

    user = await user_service.create(user_data)

    # Set as superuser
    user.is_superuser = True

    # Assign super_admin role
    super_admin_role = await role_service.get_by_name("super_admin")
    if super_admin_role:
        user.roles.append(super_admin_role)
        await db_session.commit()
        await db_session.refresh(user)

    return user


@pytest_asyncio.fixture
async def auth_headers(test_user: User) -> dict:
    """Create authentication headers for test user."""
    from app.core.security import create_access_token

    token = create_access_token(str(test_user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def admin_headers(admin_user: User) -> dict:
    """Create authentication headers for admin user."""
    from app.core.security import create_access_token

    token = create_access_token(str(admin_user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def user_without_permissions(db_session: AsyncSession) -> dict:
    """Create a user without specific permissions."""
    from app.core.security import create_access_token
    from app.schemas.user import UserCreate
    from app.services.user import UserService

    user_service = UserService(db_session)
    user_data = UserCreate(
        username="limiteduser",
        email="limited@example.com",
        password="LimitedPass123!",
        full_name="Limited User"
    )

    user = await user_service.create(user_data)
    await db_session.commit()
    token = create_access_token(str(user.id))
    return {"Authorization": f"Bearer {token}"}


async def _setup_test_roles_and_permissions(db_session: AsyncSession):
    """Setup test roles and permissions."""
    from app.services.permission import PermissionService
    from app.services.role import RoleService

    permission_service = PermissionService(db_session)
    role_service = RoleService(db_session)

    # Create permissions
    permissions_data = [
        {"name": "user:create", "display_name": "Create User", "resource": "user", "action": "create"},
        {"name": "user:read", "display_name": "Read User", "resource": "user", "action": "read"},
        {"name": "user:update", "display_name": "Update User", "resource": "user", "action": "update"},
        {"name": "user:delete", "display_name": "Delete User", "resource": "user", "action": "delete"},
        {"name": "role:create", "display_name": "Create Role", "resource": "role", "action": "create"},
        {"name": "role:read", "display_name": "Read Role", "resource": "role", "action": "read"},
        {"name": "role:update", "display_name": "Update Role", "resource": "role", "action": "update"},
        {"name": "role:delete", "display_name": "Delete Role", "resource": "role", "action": "delete"},
        {"name": "permission:create", "display_name": "Create Permission", "resource": "permission", "action": "create"},
        {"name": "permission:read", "display_name": "Read Permission", "resource": "permission", "action": "read"},
        {"name": "permission:update", "display_name": "Update Permission", "resource": "permission", "action": "update"},
        {"name": "permission:delete", "display_name": "Delete Permission", "resource": "permission", "action": "delete"},
        {"name": "system:admin", "display_name": "System Admin", "resource": "system", "action": "admin"},
    ]

    created_permissions = []
    for perm_data in permissions_data:
        existing = await permission_service.get_by_name(perm_data["name"])
        if not existing:
            permission = await permission_service.create(perm_data)
            created_permissions.append(permission)
        else:
            created_permissions.append(existing)

    await db_session.commit()

    # Create roles
    roles_data = [
        {
            "name": "super_admin",
            "display_name": "Super Administrator",
            "description": "Full system access",
            "is_system": True,
        },
        {
            "name": "admin",
            "display_name": "Administrator",
            "description": "Administrative access",
            "is_system": True,
        },
        {
            "name": "user",
            "display_name": "User",
            "description": "Basic user access",
            "is_system": True,
        }
    ]

    created_roles = []
    for role_data in roles_data:
        existing = await role_service.get_by_name(role_data["name"])
        if not existing:
            role = await role_service.create(role_data)
            created_roles.append(role)
        else:
            created_roles.append(existing)

    await db_session.commit()

    # Assign permissions to roles
    if created_roles and created_permissions:
        # Super admin gets all permissions
        super_admin_role = next((r for r in created_roles if r.name == "super_admin"), None)
        if super_admin_role:
            for permission in created_permissions:
                await role_service.assign_permission(super_admin_role.id, permission.id)

        # Admin gets most permissions except system:admin
        admin_role = next((r for r in created_roles if r.name == "admin"), None)
        if admin_role:
            for permission in created_permissions[:-1]:  # All except system:admin
                await role_service.assign_permission(admin_role.id, permission.id)

        # User gets only user:read permission
        user_role = next((r for r in created_roles if r.name == "user"), None)
        if user_role:
            user_read_perm = next((p for p in created_permissions if p.name == "user:read"), None)
            if user_read_perm:
                await role_service.assign_permission(user_role.id, user_read_perm.id)

    await db_session.commit()


# Legacy fixtures for backward compatibility
@pytest.fixture
def test_user_data():
    """Test user data."""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "full_name": "Test User",
        "password": "TestPassword123!",
    }


@pytest.fixture
def test_admin_data():
    """Test admin user data."""
    return {
        "username": "testadmin",
        "email": "admin@example.com",
        "full_name": "Test Admin",
        "password": "AdminPassword123!",
    }
