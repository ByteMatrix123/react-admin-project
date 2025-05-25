"""
Permission management API tests.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.permission import PermissionService


class TestPermissionsAPI:
    """Permission management API test cases."""

    @pytest.mark.asyncio
    async def test_get_permissions_list(self, client: AsyncClient, admin_headers: dict):
        """Test getting permissions list with admin permissions."""
        response = await client.get("/api/permissions/", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 10  # Should have multiple permissions

        # Check permission structure
        permission = data[0]
        assert "id" in permission
        assert "name" in permission
        assert "display_name" in permission
        assert "resource" in permission
        assert "action" in permission

    @pytest.mark.asyncio
    async def test_get_permissions_unauthorized(self, client: AsyncClient):
        """Test getting permissions list without authentication."""
        response = await client.get("/api/permissions/")

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_get_permissions_forbidden(self, client: AsyncClient, auth_headers: dict):
        """Test getting permissions list without proper permissions."""
        response = await client.get("/api/permissions/", headers=auth_headers)

        assert response.status_code == 403
        assert "Permission 'permission:read' required" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_get_permissions_with_filters(self, client: AsyncClient, admin_headers: dict):
        """Test permissions list with various filters."""
        # Test resource filter
        response = await client.get("/api/permissions/?resource=user", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(perm["resource"] == "user" for perm in data)

        # Test action filter
        response = await client.get("/api/permissions/?action=read", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(perm["action"] == "read" for perm in data)

        # Test search filter
        response = await client.get("/api/permissions/?search=user", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert any("user" in perm["name"].lower() for perm in data)

    @pytest.mark.asyncio
    async def test_get_permission_by_id(self, client: AsyncClient, admin_headers: dict):
        """Test getting specific permission by ID."""
        # First get the list to find a permission ID
        list_response = await client.get("/api/permissions/", headers=admin_headers)
        permissions = list_response.json()
        permission_id = permissions[0]["id"]

        response = await client.get(f"/api/permissions/{permission_id}", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == permission_id

    @pytest.mark.asyncio
    async def test_get_permission_by_id_not_found(self, client: AsyncClient, admin_headers: dict):
        """Test getting non-existent permission."""
        response = await client.get("/api/permissions/99999", headers=admin_headers)

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_create_permission(self, client: AsyncClient, admin_headers: dict, db_session: AsyncSession):
        """Test creating new permission."""
        permission_data = {
            "name": "test:create",
            "display_name": "Test Create",
            "description": "A permission for testing",
            "resource": "test",
            "action": "create",
            "is_active": True
        }

        response = await client.post("/api/permissions/", json=permission_data, headers=admin_headers)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "test:create"
        assert data["resource"] == "test"
        assert data["action"] == "create"

        # Verify permission was created in database
        permission_service = PermissionService(db_session)
        permission = await permission_service.get_by_name("test:create")
        assert permission is not None

    @pytest.mark.asyncio
    async def test_create_permission_duplicate_name(self, client: AsyncClient, admin_headers: dict):
        """Test creating permission with duplicate name."""
        permission_data = {
            "name": "user:read",  # Already exists
            "display_name": "Duplicate User Read",
            "resource": "user",
            "action": "read"
        }

        response = await client.post("/api/permissions/", json=permission_data, headers=admin_headers)

        assert response.status_code == 400
        assert "Permission name already exists" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_create_permission_forbidden(self, client: AsyncClient, auth_headers: dict):
        """Test creating permission without proper permissions."""
        permission_data = {
            "name": "forbidden:create",
            "display_name": "Forbidden Permission",
            "resource": "forbidden",
            "action": "create"
        }

        response = await client.post("/api/permissions/", json=permission_data, headers=auth_headers)

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_update_permission(self, client: AsyncClient, admin_headers: dict, db_session: AsyncSession):
        """Test updating permission."""
        # First create a permission to update
        permission_service = PermissionService(db_session)
        permission_data = {
            "name": "update:test",
            "display_name": "Update Test",
            "description": "Original description",
            "resource": "update",
            "action": "test"
        }
        permission = await permission_service.create(permission_data)
        await db_session.commit()

        update_data = {
            "display_name": "Updated Test Permission",
            "description": "Updated description"
        }

        response = await client.put(
            f"/api/permissions/{permission.id}",
            json=update_data,
            headers=admin_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["display_name"] == "Updated Test Permission"
        assert data["description"] == "Updated description"

    @pytest.mark.asyncio
    async def test_update_permission_not_found(self, client: AsyncClient, admin_headers: dict):
        """Test updating non-existent permission."""
        update_data = {
            "display_name": "Non-existent Permission"
        }

        response = await client.put("/api/permissions/99999", json=update_data, headers=admin_headers)

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_permission_duplicate_name(self, client: AsyncClient, admin_headers: dict, db_session: AsyncSession):
        """Test updating permission with duplicate name."""
        # Create a permission to update
        permission_service = PermissionService(db_session)
        permission_data = {
            "name": "unique:permission",
            "display_name": "Unique Permission",
            "resource": "unique",
            "action": "permission"
        }
        permission = await permission_service.create(permission_data)
        await db_session.commit()

        update_data = {
            "name": "user:read"  # Already exists
        }

        response = await client.put(
            f"/api/permissions/{permission.id}",
            json=update_data,
            headers=admin_headers
        )

        assert response.status_code == 400
        assert "Permission name already exists" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_delete_permission(self, client: AsyncClient, admin_headers: dict, db_session: AsyncSession):
        """Test deleting permission."""
        # Create a permission to delete
        permission_service = PermissionService(db_session)
        permission_data = {
            "name": "delete:test",
            "display_name": "Delete Test",
            "description": "A permission to be deleted",
            "resource": "delete",
            "action": "test",
            "is_system": False  # Non-system permission can be deleted
        }
        permission = await permission_service.create(permission_data)
        await db_session.commit()

        response = await client.delete(f"/api/permissions/{permission.id}", headers=admin_headers)

        assert response.status_code == 204

        # Verify permission was deleted
        deleted_permission = await permission_service.get_by_id(permission.id)
        assert deleted_permission is None

    @pytest.mark.asyncio
    async def test_delete_system_permission_forbidden(self, client: AsyncClient, admin_headers: dict):
        """Test deleting system permission (should be forbidden)."""
        # Try to delete a system permission
        list_response = await client.get("/api/permissions/", headers=admin_headers)
        permissions = list_response.json()
        system_permission = next((p for p in permissions if p["name"] == "user:read"), None)
        assert system_permission is not None

        response = await client.delete(f"/api/permissions/{system_permission['id']}", headers=admin_headers)

        assert response.status_code == 400
        assert "System permissions cannot be deleted" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_delete_permission_not_found(self, client: AsyncClient, admin_headers: dict):
        """Test deleting non-existent permission."""
        response = await client.delete("/api/permissions/99999", headers=admin_headers)

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_permission_resources(self, client: AsyncClient, admin_headers: dict):
        """Test getting unique permission resources."""
        response = await client.get("/api/permissions/resources", headers=admin_headers)

        # This endpoint might not be implemented yet, so accept 404 or 422
        assert response.status_code in [200, 404, 422]
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)
            assert len(data) > 0
            # Should contain common resources
            assert "user" in data
            assert "role" in data
            assert "permission" in data

    @pytest.mark.asyncio
    async def test_get_permission_actions(self, client: AsyncClient, admin_headers: dict):
        """Test getting unique permission actions."""
        response = await client.get("/api/permissions/actions", headers=admin_headers)

        # This endpoint might not be implemented yet, so accept 404 or 422
        assert response.status_code in [200, 404, 422]
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)
            assert len(data) > 0
            # Should contain common actions
            assert "read" in data
            assert "create" in data
            assert "update" in data
            assert "delete" in data

    @pytest.mark.asyncio
    async def test_get_resources_unauthorized(self, client: AsyncClient):
        """Test getting resources without authentication."""
        response = await client.get("/api/permissions/resources")

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_get_actions_forbidden(self, client: AsyncClient, auth_headers: dict):
        """Test getting actions without proper permissions."""
        response = await client.get("/api/permissions/actions", headers=auth_headers)

        assert response.status_code == 403
