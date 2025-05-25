"""
Role management API tests.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.role import RoleService


class TestRolesAPI:
    """Role management API test cases."""

    @pytest.mark.asyncio
    async def test_get_roles_list(self, client: AsyncClient, admin_headers: dict):
        """Test getting roles list with admin permissions."""
        response = await client.get("/api/roles/", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # At least super_admin, admin, user roles

        # Check role structure
        role = data[0]
        assert "id" in role
        assert "name" in role
        assert "display_name" in role
        assert "permissions" in role

    @pytest.mark.asyncio
    async def test_get_roles_unauthorized(self, client: AsyncClient):
        """Test getting roles list without authentication."""
        response = await client.get("/api/roles/")

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_get_roles_forbidden(self, client: AsyncClient, auth_headers: dict):
        """Test getting roles list without proper permissions."""
        response = await client.get("/api/roles/", headers=auth_headers)

        assert response.status_code == 403
        assert "Permission 'role:read' required" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_get_roles_with_search(self, client: AsyncClient, admin_headers: dict):
        """Test roles list with search parameter."""
        response = await client.get("/api/roles/?search=admin", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        # Should find admin-related roles
        assert any("admin" in role["name"].lower() for role in data)

    @pytest.mark.asyncio
    async def test_get_role_by_id(self, client: AsyncClient, admin_headers: dict):
        """Test getting specific role by ID."""
        # First get the list to find a role ID
        list_response = await client.get("/api/roles/", headers=admin_headers)
        roles = list_response.json()
        role_id = roles[0]["id"]

        response = await client.get(f"/api/roles/{role_id}", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == role_id
        assert "permissions" in data

    @pytest.mark.asyncio
    async def test_get_role_by_id_not_found(self, client: AsyncClient, admin_headers: dict):
        """Test getting non-existent role."""
        response = await client.get("/api/roles/99999", headers=admin_headers)

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_create_role(self, client: AsyncClient, admin_headers: dict, db_session: AsyncSession):
        """Test creating new role."""
        role_data = {
            "name": "test_role",
            "display_name": "Test Role",
            "description": "A role for testing",
            "is_active": True
        }

        response = await client.post("/api/roles/", json=role_data, headers=admin_headers)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "test_role"
        assert data["display_name"] == "Test Role"
        assert data["description"] == "A role for testing"

        # Verify role was created in database
        role_service = RoleService(db_session)
        role = await role_service.get_by_name("test_role")
        assert role is not None

    @pytest.mark.asyncio
    async def test_create_role_duplicate_name(self, client: AsyncClient, admin_headers: dict):
        """Test creating role with duplicate name."""
        role_data = {
            "name": "admin",  # Already exists
            "display_name": "Duplicate Admin",
            "description": "This should fail"
        }

        response = await client.post("/api/roles/", json=role_data, headers=admin_headers)

        assert response.status_code == 400
        assert "Role name already exists" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_create_role_forbidden(self, client: AsyncClient, auth_headers: dict):
        """Test creating role without proper permissions."""
        role_data = {
            "name": "forbidden_role",
            "display_name": "Forbidden Role"
        }

        response = await client.post("/api/roles/", json=role_data, headers=auth_headers)

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_update_role(self, client: AsyncClient, admin_headers: dict, db_session: AsyncSession):
        """Test updating role."""
        # First create a role to update
        role_service = RoleService(db_session)
        role_data = {
            "name": "update_test",
            "display_name": "Update Test",
            "description": "Original description"
        }
        role = await role_service.create(role_data)
        await db_session.commit()

        update_data = {
            "display_name": "Updated Test Role",
            "description": "Updated description"
        }

        response = await client.put(
            f"/api/roles/{role.id}",
            json=update_data,
            headers=admin_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["display_name"] == "Updated Test Role"
        assert data["description"] == "Updated description"

    @pytest.mark.asyncio
    async def test_update_role_not_found(self, client: AsyncClient, admin_headers: dict):
        """Test updating non-existent role."""
        update_data = {
            "display_name": "Non-existent Role"
        }

        response = await client.put("/api/roles/99999", json=update_data, headers=admin_headers)

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_role_duplicate_name(self, client: AsyncClient, admin_headers: dict, db_session: AsyncSession):
        """Test updating role with duplicate name."""
        # Create a role to update
        role_service = RoleService(db_session)
        role_data = {
            "name": "unique_role",
            "display_name": "Unique Role"
        }
        role = await role_service.create(role_data)
        await db_session.commit()

        update_data = {
            "name": "admin"  # Already exists
        }

        response = await client.put(
            f"/api/roles/{role.id}",
            json=update_data,
            headers=admin_headers
        )

        assert response.status_code == 400
        assert "Role name already exists" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_delete_role(self, client: AsyncClient, admin_headers: dict, db_session: AsyncSession):
        """Test deleting role."""
        # Create a role to delete
        role_service = RoleService(db_session)
        role_data = {
            "name": "delete_test",
            "display_name": "Delete Test",
            "is_system": False  # Non-system role can be deleted
        }
        role = await role_service.create(role_data)
        await db_session.commit()

        response = await client.delete(f"/api/roles/{role.id}", headers=admin_headers)

        assert response.status_code == 204

        # Verify role was deleted
        deleted_role = await role_service.get_by_id(role.id)
        assert deleted_role is None

    @pytest.mark.asyncio
    async def test_delete_system_role_forbidden(self, client: AsyncClient, admin_headers: dict):
        """Test deleting system role (should be forbidden)."""
        # Try to delete the admin role (system role)
        # First get the admin role ID
        list_response = await client.get("/api/roles/", headers=admin_headers)
        roles = list_response.json()
        admin_role = next((r for r in roles if r["name"] == "admin"), None)
        assert admin_role is not None

        response = await client.delete(f"/api/roles/{admin_role['id']}", headers=admin_headers)

        assert response.status_code == 400
        assert "System roles cannot be deleted" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_delete_role_not_found(self, client: AsyncClient, admin_headers: dict):
        """Test deleting non-existent role."""
        response = await client.delete("/api/roles/99999", headers=admin_headers)

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_assign_permission_to_role(self, client: AsyncClient, admin_headers: dict, db_session: AsyncSession):
        """Test assigning permission to role."""
        # Create a test role and permission
        role_service = RoleService(db_session)
        from app.services.permission import PermissionService

        permission_service = PermissionService(db_session)

        # Create permission
        perm_data = {
            "name": "test:permission",
            "display_name": "Test Permission",
            "resource": "test",
            "action": "permission"
        }
        permission = await permission_service.create(perm_data)

        # Create role
        role_data = {
            "name": "test_assign_role",
            "display_name": "Test Assign Role"
        }
        role = await role_service.create(role_data)
        await db_session.commit()

        response = await client.post(
            f"/api/roles/{role.id}/permissions/{permission.id}",
            headers=admin_headers
        )

        assert response.status_code == 200
        # Check if response has message or is just successful
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_remove_permission_from_role(self, client: AsyncClient, admin_headers: dict, db_session: AsyncSession):
        """Test removing permission from role."""
        # Create a test role and permission, then assign it
        role_service = RoleService(db_session)
        from app.services.permission import PermissionService

        permission_service = PermissionService(db_session)

        # Create permission
        perm_data = {
            "name": "test:remove",
            "display_name": "Test Remove Permission",
            "resource": "test",
            "action": "remove"
        }
        permission = await permission_service.create(perm_data)

        # Create role
        role_data = {
            "name": "test_remove_role",
            "display_name": "Test Remove Role"
        }
        role = await role_service.create(role_data)
        await db_session.commit()

        # First assign the permission
        await role_service.assign_permission(role.id, permission.id)
        await db_session.commit()

        # Then remove it
        response = await client.delete(
            f"/api/roles/{role.id}/permissions/{permission.id}",
            headers=admin_headers
        )

        assert response.status_code == 200
        # Check if response is successful
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_assign_permission_role_not_found(self, client: AsyncClient, admin_headers: dict):
        """Test assigning permission to non-existent role."""
        response = await client.post("/api/roles/99999/permissions/1", headers=admin_headers)

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_assign_permission_permission_not_found(self, client: AsyncClient, admin_headers: dict, db_session: AsyncSession):
        """Test assigning non-existent permission to role."""
        # Create a role
        role_service = RoleService(db_session)
        role_data = {
            "name": "test_role_for_missing_perm",
            "display_name": "Test Role"
        }
        role = await role_service.create(role_data)
        await db_session.commit()

        response = await client.post(f"/api/roles/{role.id}/permissions/99999", headers=admin_headers)

        assert response.status_code == 404
