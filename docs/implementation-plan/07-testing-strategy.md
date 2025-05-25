# 测试策略方案

## 🧪 测试概述

### 测试目标
- **质量保证**: 确保系统功能正确性
- **性能验证**: 验证系统性能指标
- **安全测试**: 检查安全漏洞和风险
- **兼容性测试**: 确保跨平台兼容性
- **回归测试**: 防止新功能影响现有功能

### 测试原则
- **测试驱动开发**: TDD/BDD方法论
- **自动化优先**: 最大化自动化测试覆盖
- **持续集成**: CI/CD流水线集成
- **分层测试**: 单元→集成→系统→验收
- **风险驱动**: 重点测试高风险功能

## 📊 测试金字塔

### 测试层级分布
```
        /\
       /  \
      /E2E \     10% - 端到端测试
     /______\
    /        \
   /Integration\ 20% - 集成测试
  /__________\
 /            \
/  Unit Tests  \ 70% - 单元测试
/______________\
```

### 测试类型覆盖
- **单元测试**: 70% - 函数、方法、组件
- **集成测试**: 20% - 模块间交互
- **端到端测试**: 10% - 完整用户流程

## 🔧 后端测试策略

### 单元测试框架

#### 测试配置 (backend/conftest.py)
```python
import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db
from app.models.base import Base
from app.core.config import settings

# 测试数据库配置
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

# 创建测试引擎
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)

@pytest.fixture(scope="session")
def event_loop():
    """创建事件循环"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """创建测试数据库会话"""
    async with test_engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
        
        async with TestingSessionLocal() as session:
            yield session
            
        await connection.run_sync(Base.metadata.drop_all)

@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """创建测试客户端"""
    def get_test_db():
        return db_session
    
    app.dependency_overrides[get_db] = get_test_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()

@pytest.fixture
async def test_user(db_session: AsyncSession):
    """创建测试用户"""
    from app.models.user import User
    from app.core.security import SecurityManager
    
    user = User(
        username="testuser",
        email="test@example.com",
        password_hash=SecurityManager.hash_password("testpass123"),
        first_name="Test",
        last_name="User",
        is_active=True,
        is_verified=True
    )
    
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    
    return user

@pytest.fixture
async def auth_headers(test_user):
    """创建认证头"""
    from app.core.security import SecurityManager
    
    token = SecurityManager.create_access_token(
        data={"user_id": test_user.id, "username": test_user.username}
    )
    
    return {"Authorization": f"Bearer {token}"}
```

### 单元测试示例

#### 用户服务测试 (backend/tests/test_user_service.py)
```python
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.services.user_service import UserService
from app.schemas.user import UserCreate, UserUpdate
from app.models.user import User

class TestUserService:
    """用户服务测试"""
    
    @pytest.fixture
    def user_service(self, db_session: AsyncSession):
        return UserService(db_session)
    
    async def test_create_user_success(self, user_service: UserService):
        """测试创建用户成功"""
        user_data = UserCreate(
            username="newuser",
            email="newuser@example.com",
            password="password123",
            first_name="New",
            last_name="User"
        )
        
        user = await user_service.create_user(user_data)
        
        assert user.username == "newuser"
        assert user.email == "newuser@example.com"
        assert user.first_name == "New"
        assert user.last_name == "User"
        assert user.is_active is True
        assert user.password_hash is not None
    
    async def test_create_user_duplicate_username(self, user_service: UserService, test_user: User):
        """测试创建重复用户名"""
        user_data = UserCreate(
            username=test_user.username,
            email="different@example.com",
            password="password123"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await user_service.create_user(user_data)
        
        assert exc_info.value.status_code == 400
        assert "username already exists" in str(exc_info.value.detail).lower()
    
    async def test_get_user_by_id(self, user_service: UserService, test_user: User):
        """测试根据ID获取用户"""
        user = await user_service.get_user_by_id(test_user.id)
        
        assert user is not None
        assert user.id == test_user.id
        assert user.username == test_user.username
    
    async def test_get_user_by_id_not_found(self, user_service: UserService):
        """测试获取不存在的用户"""
        user = await user_service.get_user_by_id(99999)
        assert user is None
    
    async def test_update_user(self, user_service: UserService, test_user: User):
        """测试更新用户"""
        update_data = UserUpdate(
            first_name="Updated",
            last_name="Name"
        )
        
        updated_user = await user_service.update_user(test_user.id, update_data)
        
        assert updated_user.first_name == "Updated"
        assert updated_user.last_name == "Name"
        assert updated_user.username == test_user.username  # 未更改的字段保持不变
    
    async def test_delete_user(self, user_service: UserService, test_user: User):
        """测试删除用户"""
        result = await user_service.delete_user(test_user.id)
        assert result is True
        
        # 验证用户已被删除
        deleted_user = await user_service.get_user_by_id(test_user.id)
        assert deleted_user is None
    
    async def test_get_users_with_pagination(self, user_service: UserService, db_session: AsyncSession):
        """测试分页获取用户"""
        # 创建多个测试用户
        for i in range(5):
            user = User(
                username=f"user{i}",
                email=f"user{i}@example.com",
                password_hash="hashed_password",
                is_active=True
            )
            db_session.add(user)
        
        await db_session.commit()
        
        # 测试分页
        result = await user_service.get_users(skip=0, limit=3)
        
        assert len(result.items) == 3
        assert result.pagination.total >= 5
        assert result.pagination.page == 1
        assert result.pagination.page_size == 3
```

### API测试示例

#### 用户API测试 (backend/tests/test_user_api.py)
```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

class TestUserAPI:
    """用户API测试"""
    
    async def test_get_users_unauthorized(self, client: AsyncClient):
        """测试未授权访问用户列表"""
        response = await client.get("/api/v1/users")
        assert response.status_code == 401
    
    async def test_get_users_authorized(self, client: AsyncClient, auth_headers: dict):
        """测试授权访问用户列表"""
        response = await client.get("/api/v1/users", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "items" in data["data"]
        assert "pagination" in data["data"]
    
    async def test_create_user_success(self, client: AsyncClient, auth_headers: dict):
        """测试创建用户成功"""
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "Password123!",
            "first_name": "New",
            "last_name": "User"
        }
        
        response = await client.post("/api/v1/users", json=user_data, headers=auth_headers)
        assert response.status_code == 201
        
        data = response.json()
        assert data["success"] is True
        assert data["data"]["username"] == "newuser"
        assert data["data"]["email"] == "newuser@example.com"
    
    async def test_create_user_invalid_password(self, client: AsyncClient, auth_headers: dict):
        """测试创建用户密码不符合要求"""
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "weak",  # 弱密码
            "first_name": "New",
            "last_name": "User"
        }
        
        response = await client.post("/api/v1/users", json=user_data, headers=auth_headers)
        assert response.status_code == 400
        
        data = response.json()
        assert data["success"] is False
        assert "password" in str(data["error"]).lower()
    
    async def test_get_user_detail(self, client: AsyncClient, auth_headers: dict, test_user: User):
        """测试获取用户详情"""
        response = await client.get(f"/api/v1/users/{test_user.id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["data"]["id"] == test_user.id
        assert data["data"]["username"] == test_user.username
    
    async def test_update_user(self, client: AsyncClient, auth_headers: dict, test_user: User):
        """测试更新用户"""
        update_data = {
            "first_name": "Updated",
            "last_name": "Name"
        }
        
        response = await client.put(
            f"/api/v1/users/{test_user.id}", 
            json=update_data, 
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["data"]["first_name"] == "Updated"
        assert data["data"]["last_name"] == "Name"
    
    async def test_delete_user(self, client: AsyncClient, auth_headers: dict, test_user: User):
        """测试删除用户"""
        response = await client.delete(f"/api/v1/users/{test_user.id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        # 验证用户已被删除
        response = await client.get(f"/api/v1/users/{test_user.id}", headers=auth_headers)
        assert response.status_code == 404
```

### 性能测试

#### 负载测试 (backend/tests/test_performance.py)
```python
import pytest
import asyncio
import time
from httpx import AsyncClient
from concurrent.futures import ThreadPoolExecutor

class TestPerformance:
    """性能测试"""
    
    @pytest.mark.asyncio
    async def test_concurrent_user_creation(self, client: AsyncClient, auth_headers: dict):
        """测试并发用户创建"""
        async def create_user(index: int):
            user_data = {
                "username": f"user{index}",
                "email": f"user{index}@example.com",
                "password": "Password123!",
                "first_name": f"User{index}",
                "last_name": "Test"
            }
            
            start_time = time.time()
            response = await client.post("/api/v1/users", json=user_data, headers=auth_headers)
            end_time = time.time()
            
            return {
                "status_code": response.status_code,
                "response_time": end_time - start_time,
                "index": index
            }
        
        # 并发创建100个用户
        tasks = [create_user(i) for i in range(100)]
        results = await asyncio.gather(*tasks)
        
        # 分析结果
        success_count = sum(1 for r in results if r["status_code"] == 201)
        avg_response_time = sum(r["response_time"] for r in results) / len(results)
        max_response_time = max(r["response_time"] for r in results)
        
        # 断言性能指标
        assert success_count >= 95  # 至少95%成功率
        assert avg_response_time < 1.0  # 平均响应时间小于1秒
        assert max_response_time < 5.0  # 最大响应时间小于5秒
    
    @pytest.mark.asyncio
    async def test_database_query_performance(self, db_session: AsyncSession):
        """测试数据库查询性能"""
        from app.repositories.user_repository import UserRepository
        
        # 创建大量测试数据
        users = []
        for i in range(1000):
            user = User(
                username=f"perfuser{i}",
                email=f"perfuser{i}@example.com",
                password_hash="hashed_password",
                is_active=True
            )
            users.append(user)
        
        db_session.add_all(users)
        await db_session.commit()
        
        # 测试查询性能
        user_repo = UserRepository(db_session)
        
        start_time = time.time()
        result = await user_repo.get_users_with_pagination(skip=0, limit=100)
        end_time = time.time()
        
        query_time = end_time - start_time
        
        # 断言查询性能
        assert query_time < 0.5  # 查询时间小于500ms
        assert len(result.items) == 100
        assert result.pagination.total >= 1000
```

## 🎨 前端测试策略

### 组件测试框架

#### 测试配置 (frontend/src/test-utils.tsx)
```typescript
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

// 创建测试用的QueryClient
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

// 测试包装器
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={zhCN}>
        {children}
      </ConfigProvider>
    </QueryClientProvider>
  );
};

// 自定义render函数
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// 重新导出所有testing-library工具
export * from '@testing-library/react';
export { customRender as render };

// Mock数据工厂
export const createMockUser = (overrides = {}) => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  department: '技术部',
  position: '开发工程师',
  is_active: true,
  is_verified: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  roles: ['user'],
  ...overrides,
});

export const createMockUserList = (count = 5) => ({
  items: Array.from({ length: count }, (_, index) => 
    createMockUser({ 
      id: index + 1, 
      username: `user${index + 1}`,
      email: `user${index + 1}@example.com`
    })
  ),
  pagination: {
    page: 1,
    page_size: 20,
    total: count,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  },
});
```

### 组件单元测试

#### 用户表单测试 (frontend/src/components/__tests__/UserForm.test.tsx)
```typescript
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockUser } from '@/test-utils';
import UserForm from '../UserForm';

// Mock API调用
jest.mock('@/hooks/useUserQuery', () => ({
  useCreateUser: () => ({
    mutateAsync: jest.fn().mockResolvedValue(createMockUser()),
    isLoading: false,
  }),
  useUpdateUser: () => ({
    mutateAsync: jest.fn().mockResolvedValue(createMockUser()),
    isLoading: false,
  }),
}));

describe('UserForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form correctly', () => {
    render(
      <UserForm 
        user={null} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    expect(screen.getByLabelText('用户名')).toBeInTheDocument();
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument();
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '创建' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
  });

  it('renders edit form correctly', () => {
    const mockUser = createMockUser();
    
    render(
      <UserForm 
        user={mockUser} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    expect(screen.getByDisplayValue(mockUser.username)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument();
    expect(screen.queryByLabelText('密码')).not.toBeInTheDocument(); // 编辑时不显示密码字段
    expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <UserForm 
        user={null} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    // 点击提交按钮而不填写任何字段
    await user.click(screen.getByRole('button', { name: '创建' }));

    // 验证错误消息
    await waitFor(() => {
      expect(screen.getByText('请输入用户名')).toBeInTheDocument();
      expect(screen.getByText('请输入邮箱')).toBeInTheDocument();
      expect(screen.getByText('请输入密码')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    
    render(
      <UserForm 
        user={null} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    // 输入无效邮箱
    await user.type(screen.getByLabelText('邮箱'), 'invalid-email');
    await user.click(screen.getByRole('button', { name: '创建' }));

    await waitFor(() => {
      expect(screen.getByText('请输入有效的邮箱地址')).toBeInTheDocument();
    });
  });

  it('validates password strength', async () => {
    const user = userEvent.setup();
    
    render(
      <UserForm 
        user={null} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    // 输入弱密码
    await user.type(screen.getByLabelText('密码'), '123');
    await user.click(screen.getByRole('button', { name: '创建' }));

    await waitFor(() => {
      expect(screen.getByText(/密码长度至少8位/)).toBeInTheDocument();
    });
  });

  it('submits form successfully', async () => {
    const user = userEvent.setup();
    
    render(
      <UserForm 
        user={null} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    // 填写表单
    await user.type(screen.getByLabelText('用户名'), 'newuser');
    await user.type(screen.getByLabelText('邮箱'), 'newuser@example.com');
    await user.type(screen.getByLabelText('密码'), 'Password123!');
    await user.type(screen.getByLabelText('姓名'), '新用户');

    // 提交表单
    await user.click(screen.getByRole('button', { name: '创建' }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <UserForm 
        user={null} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
```

### 页面集成测试

#### 用户管理页面测试 (frontend/src/pages/__tests__/UserManagement.test.tsx)
```typescript
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockUserList } from '@/test-utils';
import UserManagement from '../UserManagement';

// Mock hooks
jest.mock('@/hooks/useUserQuery', () => ({
  useUserList: () => ({
    data: createMockUserList(3),
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
  useDeleteUser: () => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
    isLoading: false,
  }),
  useBatchDeleteUsers: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ deleted_count: 2, failed_ids: [] }),
    isLoading: false,
  }),
}));

jest.mock('@/stores/userStore', () => ({
  useUserStore: () => ({
    searchParams: {
      page: 1,
      pageSize: 20,
      search: '',
      department: '',
      isActive: undefined,
      sortBy: 'created_at',
      sortOrder: 'desc',
    },
    selectedUserIds: [],
    setSearchParams: jest.fn(),
    setSelectedUserIds: jest.fn(),
    clearSelectedUserIds: jest.fn(),
  }),
}));

describe('UserManagement', () => {
  it('renders user list correctly', async () => {
    render(<UserManagement />);

    // 验证表格渲染
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('user2')).toBeInTheDocument();
      expect(screen.getByText('user3')).toBeInTheDocument();
    });

    // 验证操作按钮
    expect(screen.getByRole('button', { name: '新增用户' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /批量删除/ })).toBeInTheDocument();
  });

  it('opens create user modal when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<UserManagement />);

    await user.click(screen.getByRole('button', { name: '新增用户' }));

    await waitFor(() => {
      expect(screen.getByText('新增用户')).toBeInTheDocument();
    });
  });

  it('filters users by search term', async () => {
    const user = userEvent.setup();
    render(<UserManagement />);

    const searchInput = screen.getByPlaceholderText('搜索用户名或邮箱');
    await user.type(searchInput, 'test');
    await user.keyboard('{Enter}');

    // 验证搜索功能被调用
    // 这里需要根据实际的mock实现来验证
  });

  it('shows user detail modal when view button is clicked', async () => {
    const user = userEvent.setup();
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('查看');
    await user.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('用户详情')).toBeInTheDocument();
    });
  });

  it('confirms before deleting user', async () => {
    const user = userEvent.setup();
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('删除');
    await user.click(deleteButtons[0]);

    // 验证确认对话框
    await waitFor(() => {
      expect(screen.getByText('确定要删除这个用户吗？')).toBeInTheDocument();
    });
  });
});
```

## 🔄 端到端测试

### E2E测试框架

#### Playwright配置 (e2e/playwright.config.ts)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: [
    {
      command: 'npm run dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../backend && uvicorn app.main:app --reload --port 8000',
      port: 8000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

### E2E测试用例

#### 用户管理流程测试 (e2e/tests/user-management.spec.ts)
```typescript
import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'admin');
    await page.fill('[data-testid="password"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // 等待跳转到仪表盘
    await expect(page).toHaveURL('/dashboard');
    
    // 导航到用户管理页面
    await page.click('[data-testid="user-management-menu"]');
    await expect(page).toHaveURL('/users');
  });

  test('should display user list', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('h1')).toContainText('用户管理');
    
    // 验证用户表格
    await expect(page.locator('[data-testid="user-table"]')).toBeVisible();
    
    // 验证至少有一个用户
    await expect(page.locator('tbody tr')).toHaveCountGreaterThan(0);
  });

  test('should create new user', async ({ page }) => {
    // 点击新增用户按钮
    await page.click('[data-testid="add-user-button"]');
    
    // 验证模态框打开
    await expect(page.locator('[data-testid="user-form-modal"]')).toBeVisible();
    
    // 填写用户信息
    await page.fill('[data-testid="username-input"]', 'e2euser');
    await page.fill('[data-testid="email-input"]', 'e2euser@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.fill('[data-testid="first-name-input"]', 'E2E');
    await page.fill('[data-testid="last-name-input"]', 'User');
    
    // 提交表单
    await page.click('[data-testid="submit-button"]');
    
    // 验证成功消息
    await expect(page.locator('.ant-message-success')).toBeVisible();
    
    // 验证模态框关闭
    await expect(page.locator('[data-testid="user-form-modal"]')).not.toBeVisible();
    
    // 验证新用户出现在列表中
    await expect(page.locator('text=e2euser')).toBeVisible();
  });

  test('should edit user', async ({ page }) => {
    // 点击第一个用户的编辑按钮
    await page.click('[data-testid="edit-user-button"]:first-child');
    
    // 验证模态框打开并预填数据
    await expect(page.locator('[data-testid="user-form-modal"]')).toBeVisible();
    
    // 修改用户信息
    await page.fill('[data-testid="first-name-input"]', 'Updated');
    
    // 提交表单
    await page.click('[data-testid="submit-button"]');
    
    // 验证成功消息
    await expect(page.locator('.ant-message-success')).toBeVisible();
    
    // 验证更新后的信息
    await expect(page.locator('text=Updated')).toBeVisible();
  });

  test('should delete user', async ({ page }) => {
    // 点击删除按钮
    await page.click('[data-testid="delete-user-button"]:first-child');
    
    // 确认删除
    await page.click('[data-testid="confirm-delete"]');
    
    // 验证成功消息
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });

  test('should search users', async ({ page }) => {
    // 输入搜索关键词
    await page.fill('[data-testid="search-input"]', 'admin');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // 验证搜索结果
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('text=admin')).toBeVisible();
  });

  test('should filter users by department', async ({ page }) => {
    // 选择部门筛选
    await page.click('[data-testid="department-filter"]');
    await page.click('text=技术部');
    
    // 验证筛选结果
    await expect(page.locator('tbody tr')).toHaveCountGreaterThan(0);
  });

  test('should batch delete users', async ({ page }) => {
    // 选择多个用户
    await page.check('[data-testid="user-checkbox"]:first-child');
    await page.check('[data-testid="user-checkbox"]:nth-child(2)');
    
    // 点击批量删除
    await page.click('[data-testid="batch-delete-button"]');
    
    // 确认删除
    await page.click('[data-testid="confirm-batch-delete"]');
    
    // 验证成功消息
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });
});
```

## 📊 测试报告和覆盖率

### 覆盖率配置

#### Jest配置 (frontend/jest.config.js)
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};
```

#### Pytest配置 (backend/pytest.ini)
```ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --cov=app
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=80
    --strict-markers
    --disable-warnings
markers =
    unit: Unit tests
    integration: Integration tests
    e2e: End-to-end tests
    slow: Slow running tests
```

## 🚀 CI/CD集成

### GitHub Actions工作流

#### 测试工作流 (.github/workflows/test.yml)
```yaml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
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
        cd backend
        pip install -r requirements/dev.txt
    
    - name: Run tests
      run: |
        cd backend
        pytest --cov=app --cov-report=xml
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost/test_db
        REDIS_URL: redis://localhost:6379
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run tests
      run: |
        cd frontend
        npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./frontend/coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd frontend && npm ci
        cd backend && pip install -r requirements/dev.txt
    
    - name: Install Playwright
      run: |
        cd e2e
        npm ci
        npx playwright install --with-deps
    
    - name: Run E2E tests
      run: |
        cd e2e
        npx playwright test
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: e2e/playwright-report/
```

## 📋 测试检查清单

### 开发阶段测试
- [ ] 单元测试编写
- [ ] 组件测试覆盖
- [ ] API测试验证
- [ ] 集成测试实施
- [ ] 代码覆盖率达标

### 功能测试
- [ ] 用户注册登录
- [ ] 权限控制验证
- [ ] 数据CRUD操作
- [ ] 文件上传下载
- [ ] 搜索筛选功能

### 性能测试
- [ ] 响应时间测试
- [ ] 并发用户测试
- [ ] 数据库性能测试
- [ ] 内存使用测试
- [ ] 负载压力测试

### 安全测试
- [ ] 身份认证测试
- [ ] 权限绕过测试
- [ ] SQL注入测试
- [ ] XSS攻击测试
- [ ] CSRF攻击测试

### 兼容性测试
- [ ] 浏览器兼容性
- [ ] 移动端适配
- [ ] 不同分辨率测试
- [ ] 网络环境测试
- [ ] 操作系统兼容性 
