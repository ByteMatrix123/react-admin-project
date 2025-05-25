"""
Simple tests to verify test infrastructure.
"""

import pytest
from httpx import AsyncClient


class TestSimple:
    """Simple test cases."""

    @pytest.mark.asyncio
    async def test_health_endpoint(self, client: AsyncClient):
        """Test health endpoint."""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "timestamp" in data

    @pytest.mark.asyncio
    async def test_root_endpoint(self):
        """Test root endpoint without database dependency."""
        import httpx

        from main import app

        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/")
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert "version" in data
