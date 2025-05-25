"""
Authentication API tests.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.user import UserService


class TestAuthAPI:
    """Authentication API test cases."""

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, test_user: User):
        """Test successful login."""
        response = await client.post(
            "/api/auth/login",
            json={"username": "testuser", "password": "TestPass123!"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["username"] == "testuser"

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, client: AsyncClient):
        """Test login with invalid credentials."""
        response = await client.post(
            "/api/auth/login",
            json={"username": "testuser", "password": "wrongpassword"}
        )

        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with non-existent user."""
        response = await client.post(
            "/api/auth/login",
            json={"username": "nonexistent", "password": "TestPass123!"}
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_current_user(self, client: AsyncClient, auth_headers: dict):
        """Test getting current user info."""
        response = await client.get("/api/auth/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "username" in data
        assert "email" in data
        assert "roles" in data

    @pytest.mark.asyncio
    async def test_get_current_user_unauthorized(self, client: AsyncClient):
        """Test getting current user without authentication."""
        response = await client.get("/api/auth/me")

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, client: AsyncClient):
        """Test getting current user with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await client.get("/api/auth/me", headers=headers)

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_token(self, client: AsyncClient, test_user: User):
        """Test token refresh."""
        # First login to get refresh token
        login_response = await client.post(
            "/api/auth/login",
            json={"username": "testuser", "password": "TestPass123!"}
        )
        refresh_token = login_response.json()["refresh_token"]

        # Use refresh token to get new access token
        response = await client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token}
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    @pytest.mark.asyncio
    async def test_refresh_token_invalid(self, client: AsyncClient):
        """Test refresh with invalid token."""
        response = await client.post(
            "/api/auth/refresh",
            json={"refresh_token": "invalid_token"}
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_logout(self, client: AsyncClient, auth_headers: dict):
        """Test user logout."""
        response = await client.post("/api/auth/logout", headers=auth_headers)

        assert response.status_code == 200
        assert "Logged out successfully" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_register_success(self, client: AsyncClient, db_session: AsyncSession):
        """Test successful user registration."""
        user_data = {
            "username": "newuser",
            "email": "newuser@test.com",
            "password": "NewPass123!",
            "full_name": "New User"
        }

        response = await client.post("/api/auth/register", json=user_data)

        assert response.status_code == 200
        assert "User registered successfully" in response.json()["message"]

        # Verify user was created in database
        user_service = UserService(db_session)
        user = await user_service.get_by_username("newuser")
        assert user is not None
        assert user.email == "newuser@test.com"

    @pytest.mark.asyncio
    async def test_register_duplicate_username(self, client: AsyncClient, test_user: User):
        """Test registration with duplicate username."""
        user_data = {
            "username": "testuser",  # Already exists
            "email": "different@test.com",
            "password": "NewPass123!",
            "full_name": "Different User"
        }

        response = await client.post("/api/auth/register", json=user_data)

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient, test_user: User):
        """Test registration with duplicate email."""
        user_data = {
            "username": "differentuser",
            "email": "test@example.com",  # Already exists
            "password": "NewPass123!",
            "full_name": "Different User"
        }

        response = await client.post("/api/auth/register", json=user_data)

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_register_invalid_password(self, client: AsyncClient):
        """Test registration with invalid password."""
        user_data = {
            "username": "newuser",
            "email": "newuser@test.com",
            "password": "weak",  # Too weak
            "full_name": "New User"
        }

        response = await client.post("/api/auth/register", json=user_data)

        assert response.status_code == 422  # Validation error
