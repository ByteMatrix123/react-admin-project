"""
Tests for /auth/me endpoint.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.user import Permission, Role, User
from app.schemas.auth import AuthUser


class TestAuthMeAPI:
    """Test auth me endpoint."""

    @pytest.mark.asyncio
    async def test_get_current_user_success(
        self, client: AsyncClient, db_session: AsyncSession, test_user: User
    ):
        """Test successful get current user."""
        # Create access token
        access_token = create_access_token(subject=test_user.id)

        # Make request
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 200
        data = response.json()

        # Verify basic user information
        assert data["id"] == test_user.id
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name
        assert data["first_name"] == test_user.first_name
        assert data["last_name"] == test_user.last_name
        assert data["phone"] == test_user.phone
        assert data["avatar_url"] == test_user.avatar_url

        # Verify work information
        assert data["department"] == test_user.department
        assert data["position"] == test_user.position
        assert data["employee_id"] == test_user.employee_id

        # Verify personal information
        assert data["location"] == test_user.location
        assert data["bio"] == test_user.bio

        # Verify status and settings
        assert data["is_active"] == test_user.is_active
        assert data["is_verified"] == test_user.is_verified
        assert data["is_superuser"] == test_user.is_superuser

        # Verify settings
        assert data["language"] == test_user.language
        assert data["timezone"] == test_user.timezone
        assert data["theme"] == test_user.theme

        # Verify notification settings
        assert data["email_notifications"] == test_user.email_notifications
        assert data["browser_notifications"] == test_user.browser_notifications
        assert data["mobile_notifications"] == test_user.mobile_notifications

        # Verify privacy settings
        assert data["show_online_status"] == test_user.show_online_status
        assert data["allow_data_collection"] == test_user.allow_data_collection

        # Verify security settings
        assert data["two_factor_enabled"] == test_user.two_factor_enabled
        assert data["session_timeout"] == test_user.session_timeout

        # Verify timestamps
        assert "created_at" in data
        assert "updated_at" in data

        # Verify roles and permissions
        assert "roles" in data
        assert "permissions" in data
        assert isinstance(data["roles"], list)
        assert isinstance(data["permissions"], list)

    @pytest.mark.asyncio
    async def test_get_current_user_with_roles_and_permissions(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test get current user with roles and permissions."""
        # Create permissions
        permission1 = Permission(
            name="user:read",
            display_name="Read Users",
            description="Can read user information",
            resource="user",
            action="read"
        )
        permission2 = Permission(
            name="user:write",
            display_name="Write Users",
            description="Can create and update users",
            resource="user",
            action="write"
        )
        db_session.add(permission1)
        db_session.add(permission2)
        await db_session.commit()
        await db_session.refresh(permission1)
        await db_session.refresh(permission2)

        # Create role
        role = Role(
            name="admin",
            display_name="Administrator",
            description="System administrator role"
        )
        role.permissions = [permission1, permission2]
        db_session.add(role)
        await db_session.commit()
        await db_session.refresh(role)

        # Create user with role
        user = User(
            username="admin_user",
            email="admin@example.com",
            hashed_password="hashed_password",
            full_name="Admin User",
            is_active=True,
            is_verified=True,
            is_superuser=False
        )
        user.roles = [role]
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        # Create access token
        access_token = create_access_token(subject=user.id)

        # Make request
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 200
        data = response.json()

        # Verify user information
        assert data["id"] == user.id
        assert data["username"] == user.username
        assert data["email"] == user.email

        # Verify roles
        assert len(data["roles"]) == 1
        role_data = data["roles"][0]
        assert role_data["id"] == role.id
        assert role_data["name"] == role.name
        assert role_data["display_name"] == role.display_name
        assert role_data["description"] == role.description

        # Verify permissions
        assert len(data["permissions"]) == 2
        assert "user:read" in data["permissions"]
        assert "user:write" in data["permissions"]

    @pytest.mark.asyncio
    async def test_get_current_user_unauthorized(self, client: AsyncClient):
        """Test get current user without token."""
        response = await client.get("/api/auth/me")

        assert response.status_code == 403
        assert "detail" in response.json()

    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, client: AsyncClient):
        """Test get current user with invalid token."""
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )

        assert response.status_code == 401
        assert "detail" in response.json()

    @pytest.mark.asyncio
    async def test_get_current_user_inactive_user(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test get current user with inactive user."""
        # Create inactive user
        user = User(
            username="inactive_user",
            email="inactive@example.com",
            hashed_password="hashed_password",
            full_name="Inactive User",
            is_active=False,
            is_verified=True,
            is_superuser=False
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        # Create access token
        access_token = create_access_token(subject=user.id)

        # Make request
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 400
        assert "detail" in response.json()

    @pytest.mark.asyncio
    async def test_auth_user_schema_validation(self, test_user: User):
        """Test AuthUser schema validation."""
        # Test creating AuthUser from user model
        auth_user = AuthUser.from_user(test_user)

        # Verify all fields are properly mapped
        assert auth_user.id == test_user.id
        assert auth_user.username == test_user.username
        assert auth_user.email == test_user.email
        assert auth_user.full_name == test_user.full_name
        assert auth_user.first_name == test_user.first_name
        assert auth_user.last_name == test_user.last_name
        assert auth_user.phone == test_user.phone
        assert auth_user.avatar_url == test_user.avatar_url
        assert auth_user.department == test_user.department
        assert auth_user.position == test_user.position
        assert auth_user.employee_id == test_user.employee_id
        assert auth_user.location == test_user.location
        assert auth_user.bio == test_user.bio
        assert auth_user.is_active == test_user.is_active
        assert auth_user.is_verified == test_user.is_verified
        assert auth_user.is_superuser == test_user.is_superuser
        assert auth_user.language == test_user.language
        assert auth_user.timezone == test_user.timezone
        assert auth_user.theme == test_user.theme
        assert auth_user.email_notifications == test_user.email_notifications
        assert auth_user.browser_notifications == test_user.browser_notifications
        assert auth_user.mobile_notifications == test_user.mobile_notifications
        assert auth_user.show_online_status == test_user.show_online_status
        assert auth_user.allow_data_collection == test_user.allow_data_collection
        assert auth_user.two_factor_enabled == test_user.two_factor_enabled
        assert auth_user.session_timeout == test_user.session_timeout
        assert auth_user.created_at == test_user.created_at
        assert auth_user.updated_at == test_user.updated_at

        # Verify roles and permissions are lists
        assert isinstance(auth_user.roles, list)
        assert isinstance(auth_user.permissions, list)

    @pytest.mark.asyncio
    async def test_get_current_user_complete_profile(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test get current user with complete profile information."""
        from datetime import datetime

        # Create user with complete profile
        user = User(
            username="complete_user",
            email="complete@example.com",
            hashed_password="hashed_password",
            full_name="Complete User",
            first_name="Complete",
            last_name="User",
            phone="+1234567890",
            avatar_url="https://example.com/avatar.jpg",
            department="Engineering",
            position="Senior Developer",
            employee_id="EMP001",
            birthday=datetime(1990, 1, 1),
            location="San Francisco, CA",
            bio="A complete user profile for testing",
            is_active=True,
            is_verified=True,
            is_superuser=False,
            language="en-US",
            timezone="America/Los_Angeles",
            theme="dark",
            email_notifications=False,
            browser_notifications=False,
            mobile_notifications=False,
            show_online_status=False,
            allow_data_collection=True,
            two_factor_enabled=True,
            session_timeout=120
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        # Create access token
        access_token = create_access_token(subject=user.id)

        # Make request
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 200
        data = response.json()

        # Verify all profile fields
        assert data["username"] == "complete_user"
        assert data["email"] == "complete@example.com"
        assert data["full_name"] == "Complete User"
        assert data["first_name"] == "Complete"
        assert data["last_name"] == "User"
        assert data["phone"] == "+1234567890"
        assert data["avatar_url"] == "https://example.com/avatar.jpg"
        assert data["department"] == "Engineering"
        assert data["position"] == "Senior Developer"
        assert data["employee_id"] == "EMP001"
        assert data["birthday"] == "1990-01-01T00:00:00"
        assert data["location"] == "San Francisco, CA"
        assert data["bio"] == "A complete user profile for testing"
        assert data["language"] == "en-US"
        assert data["timezone"] == "America/Los_Angeles"
        assert data["theme"] == "dark"
        assert data["email_notifications"] == False
        assert data["browser_notifications"] == False
        assert data["mobile_notifications"] == False
        assert data["show_online_status"] == False
        assert data["allow_data_collection"] == True
        assert data["two_factor_enabled"] == True
        assert data["session_timeout"] == 120
