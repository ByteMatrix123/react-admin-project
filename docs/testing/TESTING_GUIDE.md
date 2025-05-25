# 🧪 企业后台管理系统 - 测试指南

## 📋 概述

本文档提供了企业后台管理系统的完整测试指南，包括测试环境搭建、测试执行和测试开发指导。

## 🚀 快速开始

### 1. 环境准备

```bash
# 确保PostgreSQL和Redis运行
docker ps | grep postgres
docker ps | grep redis

# 创建测试数据库
docker exec enterprise_postgres psql -U postgres -c "CREATE DATABASE test_enterprise_admin;"

# 激活虚拟环境
source .venv/bin/activate
```

### 2. 运行测试

```bash
# 运行所有测试
make test

# 运行特定模块测试
make test-simple      # 基础功能测试
make test-auth        # 认证API测试
make test-users       # 用户管理测试
make test-roles       # 角色管理测试
make test-permissions # 权限管理测试
make test-integration # 集成测试

# 运行测试脚本
make test-runner

# 生成覆盖率报告
make test-cov
```

## 📁 测试结构

```
tests/
├── conftest.py              # 测试配置和夹具
├── test_simple.py          # 基础功能测试
├── test_auth.py            # 认证API测试
├── test_users.py           # 用户管理API测试
├── test_roles.py           # 角色管理API测试
├── test_permissions.py     # 权限管理API测试
└── test_integration.py     # 集成测试
```

## 🔧 测试配置

### pytest.ini
```ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    -v
    --tb=short
    --strict-markers
    --disable-warnings
    --cov=app
    --cov-report=term-missing
    --cov-report=html:htmlcov
    --cov-fail-under=80
asyncio_mode = auto
asyncio_default_fixture_loop_scope = function
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow running tests
    auth: Authentication related tests
    rbac: Role-based access control tests
```

### 测试数据库配置
```python
# tests/conftest.py
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:password@localhost:5432/test_enterprise_admin"
```

## 🧪 测试夹具

### 核心夹具

#### `db_session`
为每个测试创建独立的数据库会话，确保测试隔离。

```python
@pytest_asyncio.fixture(scope="function")
async def db_session():
    """Create a test database session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
```

#### `client`
配置HTTP客户端用于API测试。

```python
@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession):
    """Create a test client."""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
```

#### `test_user` / `admin_user`
创建测试用户和管理员用户。

```python
@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    from app.services.user import UserService
    
    user_service = UserService(db_session)
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "TestPass123!",
        "full_name": "Test User"
    }
    
    user = await user_service.create(user_data)
    return user
```

#### `auth_headers` / `admin_headers`
生成JWT认证头。

```python
@pytest_asyncio.fixture
async def auth_headers(test_user: User) -> dict:
    """Create authentication headers for test user."""
    from app.core.security import create_access_token
    
    token = create_access_token(str(test_user.id))
    return {"Authorization": f"Bearer {token}"}
```

## 📝 编写测试

### 基本测试结构

```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

class TestYourAPI:
    """Your API test cases."""

    @pytest.mark.asyncio
    async def test_your_endpoint(self, client: AsyncClient, auth_headers: dict):
        """Test your endpoint."""
        response = await client.get("/api/your-endpoint", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "expected_field" in data
```

### 测试标记

使用pytest标记来分类测试：

```python
@pytest.mark.unit
@pytest.mark.auth
async def test_login_success(self, client: AsyncClient, test_user: User):
    """Test successful login."""
    # 测试代码
```

### 数据库测试

```python
@pytest.mark.asyncio
async def test_create_user(self, client: AsyncClient, admin_headers: dict, db: AsyncSession):
    """Test creating new user."""
    user_data = {
        "username": "newuser",
        "email": "newuser@test.com",
        "password": "NewPass123!",
        "full_name": "New User"
    }
    
    response = await client.post("/api/users/", json=user_data, headers=admin_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "newuser"
    
    # 验证数据库中的数据
    user_service = UserService(db)
    user = await user_service.get_by_username("newuser")
    assert user is not None
```

## 🔍 测试类型

### 1. 单元测试 (`@pytest.mark.unit`)
测试单个函数或方法的功能。

```python
@pytest.mark.unit
async def test_password_hashing():
    """Test password hashing function."""
    from app.core.security import hash_password, verify_password
    
    password = "TestPassword123!"
    hashed = hash_password(password)
    
    assert verify_password(password, hashed)
    assert not verify_password("wrong_password", hashed)
```

### 2. API测试
测试HTTP API端点。

```python
@pytest.mark.asyncio
async def test_get_users_list(self, client: AsyncClient, admin_headers: dict):
    """Test getting users list."""
    response = await client.get("/api/users/", headers=admin_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
```

### 3. 集成测试 (`@pytest.mark.integration`)
测试多个组件之间的交互。

```python
@pytest.mark.integration
async def test_complete_user_workflow(self, client: AsyncClient, admin_headers: dict):
    """Test complete user management workflow."""
    # 1. 创建用户
    user_data = {"username": "workflow_user", ...}
    create_response = await client.post("/api/users/", json=user_data, headers=admin_headers)
    user_id = create_response.json()["id"]
    
    # 2. 更新用户
    update_data = {"full_name": "Updated Name"}
    update_response = await client.put(f"/api/users/{user_id}", json=update_data, headers=admin_headers)
    
    # 3. 删除用户
    delete_response = await client.delete(f"/api/users/{user_id}", headers=admin_headers)
    
    assert all(r.status_code in [200, 201] for r in [create_response, update_response, delete_response])
```

### 4. 认证测试 (`@pytest.mark.auth`)
测试认证和授权功能。

```python
@pytest.mark.auth
async def test_protected_endpoint_requires_auth(self, client: AsyncClient):
    """Test that protected endpoint requires authentication."""
    response = await client.get("/api/users/")
    assert response.status_code == 401
```

### 5. RBAC测试 (`@pytest.mark.rbac`)
测试基于角色的访问控制。

```python
@pytest.mark.rbac
async def test_admin_only_endpoint(self, client: AsyncClient, auth_headers: dict):
    """Test that admin-only endpoint rejects regular users."""
    response = await client.get("/api/roles/", headers=auth_headers)
    assert response.status_code == 403
```

## 📊 测试覆盖率

### 生成覆盖率报告

```bash
# 生成HTML覆盖率报告
make test-cov

# 查看覆盖率报告
open htmlcov/index.html
```

### 覆盖率目标
- **总体覆盖率**: 80%+
- **核心业务逻辑**: 90%+
- **API端点**: 95%+
- **安全相关代码**: 100%

## 🚨 常见问题

### 1. 数据库连接错误
```bash
# 确保PostgreSQL运行
docker ps | grep postgres

# 检查测试数据库是否存在
docker exec enterprise_postgres psql -U postgres -l | grep test_enterprise_admin
```

### 2. 异步测试问题
确保使用正确的装饰器：
```python
@pytest.mark.asyncio
async def test_async_function():
    # 异步测试代码
```

### 3. 夹具依赖问题
确保夹具的依赖关系正确：
```python
async def test_with_auth(self, client: AsyncClient, auth_headers: dict):
    # auth_headers依赖于test_user，test_user依赖于db_session
```

### 4. 测试隔离问题
每个测试应该是独立的，不依赖其他测试的状态：
```python
# ❌ 错误：依赖其他测试
async def test_update_user(self):
    # 假设用户已经存在

# ✅ 正确：自包含测试
async def test_update_user(self, client: AsyncClient, admin_headers: dict):
    # 先创建用户，然后更新
```

## 🔧 调试测试

### 1. 运行单个测试
```bash
python -m pytest tests/test_auth.py::TestAuthAPI::test_login_success -v
```

### 2. 添加调试输出
```python
async def test_debug_example(self, client: AsyncClient):
    response = await client.get("/api/users/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200
```

### 3. 使用pdb调试
```python
async def test_with_debugger(self, client: AsyncClient):
    import pdb; pdb.set_trace()
    response = await client.get("/api/users/")
    assert response.status_code == 200
```

## 📈 最佳实践

### 1. 测试命名
- 使用描述性的测试名称
- 遵循 `test_<action>_<expected_result>` 模式

```python
# ✅ 好的命名
async def test_login_with_valid_credentials_returns_token(self):

# ❌ 不好的命名
async def test_login(self):
```

### 2. 测试组织
- 按功能模块组织测试文件
- 使用测试类组织相关测试
- 使用标记分类测试

### 3. 测试数据
- 使用夹具创建测试数据
- 避免硬编码测试数据
- 确保测试数据的清理

### 4. 断言
- 使用具体的断言
- 提供有意义的错误消息
- 测试正面和负面场景

```python
# ✅ 好的断言
assert response.status_code == 200, f"Expected 200, got {response.status_code}"
assert "access_token" in response.json(), "Response should contain access_token"

# ❌ 不好的断言
assert response.status_code
assert response.json()
```

## 🚀 持续集成

### GitHub Actions配置
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install uv
          uv sync
      - name: Run tests
        run: make test-cov
```

## 📚 参考资源

- [pytest文档](https://docs.pytest.org/)
- [pytest-asyncio文档](https://pytest-asyncio.readthedocs.io/)
- [httpx文档](https://www.python-httpx.org/)
- [FastAPI测试文档](https://fastapi.tiangolo.com/tutorial/testing/)
- [SQLAlchemy测试文档](https://docs.sqlalchemy.org/en/20/orm/session_transaction.html#joining-a-session-into-an-external-transaction-such-as-for-test-suites) 
