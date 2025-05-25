"""
Integration tests for the enterprise admin system.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


class TestSystemIntegration:
    """System integration test cases."""

    @pytest.mark.asyncio
    async def test_complete_user_workflow(self, client: AsyncClient, admin_headers: dict, db_session: AsyncSession):
        """Test complete user management workflow."""
        # 1. Create a new user
        user_data = {
            "username": "workflow_user",
            "email": "workflow@test.com",
            "password": "WorkflowPass123!",
            "full_name": "Workflow Test User",
            "department": "Testing"
        }

        create_response = await client.post("/api/users/", json=user_data, headers=admin_headers)
        assert create_response.status_code in [200, 201]  # Accept both 200 and 201 for creation
        created_user = create_response.json()
        user_id = created_user["id"]

        # 2. Get user details
        get_response = await client.get(f"/api/users/{user_id}", headers=admin_headers)
        assert get_response.status_code == 200
        user_details = get_response.json()
        assert user_details["username"] == "workflow_user"

        # 3. Update user
        update_data = {
            "full_name": "Updated Workflow User",
            "department": "Updated Testing"
        }
        update_response = await client.put(f"/api/users/{user_id}", json=update_data, headers=admin_headers)
        assert update_response.status_code == 200
        updated_user = update_response.json()
        assert updated_user["full_name"] == "Updated Workflow User"

        # 4. Assign role to user
        roles_response = await client.get("/api/roles/", headers=admin_headers)
        roles = roles_response.json()
        user_role = next(role for role in roles if role["name"] == "user")

        assign_response = await client.post(
            f"/api/users/{user_id}/roles/{user_role['id']}",
            headers=admin_headers
        )
        assert assign_response.status_code == 200

        # 5. Verify user has role
        user_with_role = await client.get(f"/api/users/{user_id}", headers=admin_headers)
        user_data = user_with_role.json()
        assert any(role["id"] == user_role["id"] for role in user_data["roles"])

        # 6. Deactivate user
        deactivate_response = await client.post(f"/api/users/{user_id}/deactivate", headers=admin_headers)
        assert deactivate_response.status_code == 200

        # 7. Verify user is deactivated
        deactivated_user = await client.get(f"/api/users/{user_id}", headers=admin_headers)
        assert not deactivated_user.json()["is_active"]

        # 8. Reactivate user
        activate_response = await client.post(f"/api/users/{user_id}/activate", headers=admin_headers)
        assert activate_response.status_code == 200

        # 9. Delete user
        delete_response = await client.delete(f"/api/users/{user_id}", headers=admin_headers)
        assert delete_response.status_code == 200

    @pytest.mark.asyncio
    async def test_role_permission_workflow(self, client: AsyncClient, admin_headers: dict, db_session: AsyncSession):
        """Test role and permission management workflow."""
        # 1. Create a new permission
        permission_data = {
            "name": "test:workflow",
            "display_name": "Test Workflow",
            "description": "Permission for testing workflow",
            "resource": "test",
            "action": "workflow"
        }

        perm_response = await client.post("/api/permissions/", json=permission_data, headers=admin_headers)
        assert perm_response.status_code == 201
        created_permission = perm_response.json()
        permission_id = created_permission["id"]

        # 2. Create a new role
        role_data = {
            "name": "test_workflow_role",
            "display_name": "Test Workflow Role",
            "description": "Role for testing workflow"
        }

        role_response = await client.post("/api/roles/", json=role_data, headers=admin_headers)
        assert role_response.status_code == 201
        created_role = role_response.json()
        role_id = created_role["id"]

        # 3. Assign permission to role
        assign_response = await client.post(
            f"/api/roles/{role_id}/permissions/{permission_id}",
            headers=admin_headers
        )
        assert assign_response.status_code == 200

        # 4. Create user and assign role
        user_data = {
            "username": "role_test_user",
            "email": "roletest@test.com",
            "password": "RoleTest123!",
            "full_name": "Role Test User"
        }

        user_response = await client.post("/api/users/", json=user_data, headers=admin_headers)
        assert user_response.status_code in [200, 201]  # Accept both 200 and 201 for creation
        created_user = user_response.json()
        user_id = created_user["id"]

        # 5. Assign role to user
        assign_role_response = await client.post(
            f"/api/users/{user_id}/roles/{role_id}",
            headers=admin_headers
        )
        assert assign_role_response.status_code == 200

        # 6. Verify user has the permission through role
        user_with_role = await client.get(f"/api/users/{user_id}", headers=admin_headers)
        user_data = user_with_role.json()
        user_role = next(role for role in user_data["roles"] if role["id"] == role_id)
        assert user_role is not None

        # 7. Remove permission from role
        remove_perm_response = await client.delete(
            f"/api/roles/{role_id}/permissions/{permission_id}",
            headers=admin_headers
        )
        assert remove_perm_response.status_code == 200

        # 8. Clean up
        await client.delete(f"/api/users/{user_id}", headers=admin_headers)
        await client.delete(f"/api/roles/{role_id}", headers=admin_headers)
        await client.delete(f"/api/permissions/{permission_id}", headers=admin_headers)

    @pytest.mark.asyncio
    async def test_authentication_authorization_flow(self, client: AsyncClient, admin_headers: dict):
        """Test complete authentication and authorization flow."""
        # 1. Create a user with specific role
        user_data = {
            "username": "auth_test_user",
            "email": "authtest@test.com",
            "password": "AuthTest123!",
            "full_name": "Auth Test User"
        }

        create_response = await client.post("/api/users/", json=user_data, headers=admin_headers)
        assert create_response.status_code in [200, 201]  # Accept both 200 and 201 for creation
        created_user = create_response.json()
        user_id = created_user["id"]

        # 2. Assign user role (basic permissions)
        roles_response = await client.get("/api/roles/", headers=admin_headers)
        roles = roles_response.json()
        user_role = next(role for role in roles if role["name"] == "user")

        assign_response = await client.post(
            f"/api/users/{user_id}/roles/{user_role['id']}",
            headers=admin_headers
        )
        assert assign_response.status_code == 200

        # 3. Login as the new user
        login_response = await client.post(
            "/api/auth/login",
            json={"username": "auth_test_user", "password": "AuthTest123!"}
        )
        assert login_response.status_code == 200
        login_data = login_response.json()
        user_token = login_data["access_token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}

        # 4. Test user can access their own profile
        profile_response = await client.get("/api/users/me/profile", headers=user_headers)
        assert profile_response.status_code == 200
        profile_data = profile_response.json()
        assert profile_data["username"] == "auth_test_user"

        # 5. Test user can update their own profile
        update_data = {"bio": "Updated bio from integration test"}
        update_response = await client.put(
            "/api/users/me/profile",
            json=update_data,
            headers=user_headers
        )
        assert update_response.status_code == 200

        # 6. Test user can access user list (basic user role has user:read permission)
        admin_response = await client.get("/api/users/", headers=user_headers)
        assert admin_response.status_code == 200

        # 7. Test user cannot create other users
        new_user_data = {
            "username": "unauthorized_user",
            "email": "unauth@test.com",
            "password": "UnAuth123!",
            "full_name": "Unauthorized User"
        }
        create_user_response = await client.post("/api/users/", json=new_user_data, headers=user_headers)
        assert create_user_response.status_code == 403

        # 8. Clean up
        await client.delete(f"/api/users/{user_id}", headers=admin_headers)

    @pytest.mark.asyncio
    async def test_file_management_integration(self, client: AsyncClient, auth_headers: dict):
        """Test file management integration."""
        # Test file listing (basic functionality)
        response = await client.get("/api/files/", headers=auth_headers)

        # Should return 200 or 403 depending on permissions
        assert response.status_code in [200, 403]

        if response.status_code == 200:
            data = response.json()
            # API might return paginated response with 'files' key
            if isinstance(data, dict) and 'files' in data:
                assert isinstance(data['files'], list)
            else:
                assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_system_health_and_status(self, client: AsyncClient):
        """Test system health and status endpoints."""
        # Test health endpoint
        health_response = await client.get("/health")
        assert health_response.status_code == 200
        health_data = health_response.json()
        assert health_data["status"] == "healthy"
        assert "timestamp" in health_data
        assert "version" in health_data

        # Test root endpoint
        root_response = await client.get("/")
        assert root_response.status_code == 200
        root_data = root_response.json()
        assert "message" in root_data
        assert "version" in root_data
        assert "docs" in root_data  # API returns 'docs' not 'docs_url'

    @pytest.mark.asyncio
    async def test_error_handling_integration(self, client: AsyncClient, admin_headers: dict):
        """Test comprehensive error handling across the system."""
        # Test 404 errors
        not_found_response = await client.get("/api/users/99999", headers=admin_headers)
        assert not_found_response.status_code == 404
        assert "detail" in not_found_response.json()

        # Test 422 validation errors
        invalid_user_data = {
            "username": "",  # Invalid: empty username
            "email": "invalid-email",  # Invalid: bad email format
            "password": "123",  # Invalid: too short
        }
        validation_response = await client.post("/api/users/", json=invalid_user_data, headers=admin_headers)
        assert validation_response.status_code == 422
        error_data = validation_response.json()
        assert "detail" in error_data

        # Test 401 unauthorized
        unauthorized_response = await client.get("/api/users/")
        assert unauthorized_response.status_code == 403

        # Test 403 forbidden
        user_headers = {"Authorization": "Bearer invalid_token"}
        forbidden_response = await client.get("/api/users/", headers=user_headers)
        assert forbidden_response.status_code in [401, 403]  # Could be either depending on token validation

        # Test duplicate resource creation (400)
        # First create a user
        user_data = {
            "username": "duplicate_test",
            "email": "duplicate@test.com",
            "password": "DuplicateTest123!",
            "full_name": "Duplicate Test"
        }
        first_response = await client.post("/api/users/", json=user_data, headers=admin_headers)
        assert first_response.status_code in [200, 201]  # Accept both 200 and 201 for creation

        # Try to create the same user again
        duplicate_response = await client.post("/api/users/", json=user_data, headers=admin_headers)
        assert duplicate_response.status_code == 400
        assert "already exists" in duplicate_response.json()["detail"].lower()

        # Clean up
        created_user = first_response.json()
        await client.delete(f"/api/users/{created_user['id']}", headers=admin_headers)

    @pytest.mark.asyncio
    async def test_data_consistency_integration(self, client: AsyncClient, admin_headers: dict):
        """Test data consistency across operations."""
        # Create a user
        user_data = {
            "username": "consistency_user",
            "email": "consistency@test.com",
            "password": "ConsistencyTest123!",
            "full_name": "Consistency Test User"
        }

        create_response = await client.post("/api/users/", json=user_data, headers=admin_headers)
        assert create_response.status_code in [200, 201]  # Accept both 200 and 201 for creation
        created_user = create_response.json()
        user_id = created_user["id"]

        # Verify user appears in list
        list_response = await client.get("/api/users/", headers=admin_headers)
        assert list_response.status_code == 200
        users_data = list_response.json()
        # Handle both direct list and paginated response
        if isinstance(users_data, dict) and 'items' in users_data:
            users_list = users_data['items']
        elif isinstance(users_data, dict) and 'users' in users_data:
            users_list = users_data['users']
        else:
            users_list = users_data
        assert any(user["id"] == user_id for user in users_list)

        # Update user and verify consistency
        update_data = {"full_name": "Updated Consistency User"}
        update_response = await client.put(f"/api/users/{user_id}", json=update_data, headers=admin_headers)
        assert update_response.status_code == 200

        # Verify update is reflected in get and list
        get_response = await client.get(f"/api/users/{user_id}", headers=admin_headers)
        assert get_response.status_code == 200
        assert get_response.json()["full_name"] == "Updated Consistency User"

        list_response = await client.get("/api/users/", headers=admin_headers)
        users_data = list_response.json()
        # Handle both direct list and paginated response
        if isinstance(users_data, dict) and 'items' in users_data:
            users_list = users_data['items']
        elif isinstance(users_data, dict) and 'users' in users_data:
            users_list = users_data['users']
        else:
            users_list = users_data
        updated_user_in_list = next(user for user in users_list if user["id"] == user_id)
        assert updated_user_in_list["full_name"] == "Updated Consistency User"

        # Test role assignment consistency
        roles_response = await client.get("/api/roles/", headers=admin_headers)
        roles = roles_response.json()
        user_role = next(role for role in roles if role["name"] == "user")

        assign_response = await client.post(
            f"/api/users/{user_id}/roles/{user_role['id']}",
            headers=admin_headers
        )
        assert assign_response.status_code == 200

        # Verify role assignment is consistent across endpoints
        user_with_role = await client.get(f"/api/users/{user_id}", headers=admin_headers)
        assert any(role["id"] == user_role["id"] for role in user_with_role.json()["roles"])

        # Clean up
        await client.delete(f"/api/users/{user_id}", headers=admin_headers)
