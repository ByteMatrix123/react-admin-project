"""
Pytest configuration and fixtures.
"""

import asyncio

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.core.deps import get_db
from app.main import app

# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:password@localhost:5432/test_enterprise_admin"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    future=True,
)

# Create test session factory
TestSessionLocal = sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session():
    """Create a test database session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession):
    """Create a test client."""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


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


@pytest_asyncio.fixture
async def authenticated_user(client: AsyncClient, test_user_data: dict):
    """Create and authenticate a test user."""
    # Register user
    response = await client.post("/api/auth/register", json=test_user_data)
    assert response.status_code == 201

    # Login user
    login_data = {
        "username": test_user_data["username"],
        "password": test_user_data["password"],
    }
    response = await client.post("/api/auth/login", data=login_data)
    assert response.status_code == 200

    token_data = response.json()
    return {
        "user": test_user_data,
        "token": token_data["access_token"],
        "headers": {"Authorization": f"Bearer {token_data['access_token']}"},
    }


@pytest_asyncio.fixture
async def authenticated_admin(client: AsyncClient, test_admin_data: dict, db_session: AsyncSession):
    """Create and authenticate a test admin user."""
    from app.services.role import RoleService
    from app.services.user import UserService

    # Create admin role if not exists
    role_service = RoleService(db_session)
    admin_role = await role_service.get_role_by_name("admin")
    if not admin_role:
        from app.schemas.role import RoleCreate
        admin_role_data = RoleCreate(
            name="admin",
            description="Administrator role",
        )
        admin_role = await role_service.create_role(admin_role_data)

    # Create admin user
    user_service = UserService(db_session)
    from app.schemas.user import UserCreate
    admin_user_data = UserCreate(**test_admin_data)
    admin_user = await user_service.create_user(admin_user_data)

    # Assign admin role
    await user_service.assign_role(admin_user.id, admin_role.id)

    # Login admin
    login_data = {
        "username": test_admin_data["username"],
        "password": test_admin_data["password"],
    }
    response = await client.post("/api/auth/login", data=login_data)
    assert response.status_code == 200

    token_data = response.json()
    return {
        "user": admin_user,
        "token": token_data["access_token"],
        "headers": {"Authorization": f"Bearer {token_data['access_token']}"},
    }
