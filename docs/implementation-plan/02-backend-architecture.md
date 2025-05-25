# 后端架构设计方案

## 🏗️ 架构概述

### 设计原则
- **分层架构**: 清晰的职责分离
- **依赖注入**: 松耦合设计
- **异步优先**: 高性能处理
- **类型安全**: 完整的类型检查
- **可测试性**: 便于单元测试

### 技术选型理由

**FastAPI**
- 高性能异步框架
- 自动API文档生成
- 完整的类型提示支持
- 内置数据验证

**SQLAlchemy 2.0**
- 现代化ORM设计
- 异步数据库操作
- 强大的查询构建器
- 数据库迁移支持

**PostgreSQL**
- 企业级数据库
- 丰富的数据类型
- 强大的查询优化
- 事务ACID支持

## 📁 项目结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI应用入口
│   ├── config.py               # 配置管理
│   ├── dependencies.py         # 依赖注入
│   ├── exceptions.py           # 异常处理
│   ├── middleware.py           # 中间件
│   │
│   ├── core/                   # 核心模块
│   │   ├── __init__.py
│   │   ├── auth.py             # 认证核心
│   │   ├── security.py         # 安全工具
│   │   ├── database.py         # 数据库连接
│   │   ├── redis.py            # Redis连接
│   │   └── logging.py          # 日志配置
│   │
│   ├── models/                 # 数据模型
│   │   ├── __init__.py
│   │   ├── base.py             # 基础模型
│   │   ├── user.py             # 用户模型
│   │   ├── role.py             # 角色模型
│   │   ├── permission.py       # 权限模型
│   │   └── audit.py            # 审计模型
│   │
│   ├── schemas/                # Pydantic模式
│   │   ├── __init__.py
│   │   ├── base.py             # 基础模式
│   │   ├── user.py             # 用户模式
│   │   ├── auth.py             # 认证模式
│   │   ├── role.py             # 角色模式
│   │   └── permission.py       # 权限模式
│   │
│   ├── api/                    # API路由
│   │   ├── __init__.py
│   │   ├── deps.py             # API依赖
│   │   ├── v1/                 # API版本1
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # 认证接口
│   │   │   ├── users.py        # 用户接口
│   │   │   ├── roles.py        # 角色接口
│   │   │   ├── permissions.py  # 权限接口
│   │   │   └── upload.py       # 文件上传
│   │   └── router.py           # 路由汇总
│   │
│   ├── services/               # 业务逻辑
│   │   ├── __init__.py
│   │   ├── base.py             # 基础服务
│   │   ├── user_service.py     # 用户服务
│   │   ├── auth_service.py     # 认证服务
│   │   ├── role_service.py     # 角色服务
│   │   ├── permission_service.py # 权限服务
│   │   └── upload_service.py   # 上传服务
│   │
│   ├── repositories/           # 数据访问层
│   │   ├── __init__.py
│   │   ├── base.py             # 基础仓库
│   │   ├── user_repository.py  # 用户仓库
│   │   ├── role_repository.py  # 角色仓库
│   │   └── permission_repository.py # 权限仓库
│   │
│   ├── utils/                  # 工具函数
│   │   ├── __init__.py
│   │   ├── datetime.py         # 时间工具
│   │   ├── validators.py       # 验证器
│   │   ├── formatters.py       # 格式化器
│   │   └── helpers.py          # 辅助函数
│   │
│   └── tests/                  # 测试代码
│       ├── __init__.py
│       ├── conftest.py         # 测试配置
│       ├── test_auth.py        # 认证测试
│       ├── test_users.py       # 用户测试
│       └── test_permissions.py # 权限测试
│
├── alembic/                    # 数据库迁移
│   ├── versions/
│   ├── env.py
│   └── alembic.ini
│
├── docker/                     # Docker配置
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   └── entrypoint.sh
│
├── requirements/               # 依赖管理
│   ├── base.txt
│   ├── dev.txt
│   └── prod.txt
│
├── scripts/                    # 脚本工具
│   ├── init_db.py
│   ├── create_superuser.py
│   └── backup_db.py
│
├── .env.example                # 环境变量示例
├── pyproject.toml              # 项目配置
└── README.md                   # 项目说明
```

## 🔧 核心组件设计

### 1. 应用入口 (main.py)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.config import settings
from app.middleware import setup_middleware

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# 中间件配置
setup_middleware(app)

# 路由配置
app.include_router(api_router, prefix=settings.API_V1_STR)
```

### 2. 配置管理 (config.py)
```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # 应用配置
    PROJECT_NAME: str = "Enterprise Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # 数据库配置
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    
    # Redis配置
    REDIS_URL: str
    
    # JWT配置
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # 文件上传配置
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 3. 数据库连接 (core/database.py)
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    echo=settings.DEBUG
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

### 4. 基础模型 (models/base.py)
```python
from sqlalchemy import Column, Integer, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

class BaseModel(Base):
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True, nullable=False)
```

### 5. 基础仓库 (repositories/base.py)
```python
from typing import Generic, TypeVar, Type, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from app.models.base import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db
    
    async def get(self, id: int) -> Optional[ModelType]:
        result = await self.db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_multi(
        self, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        result = await self.db.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return result.scalars().all()
    
    async def create(self, obj_in: dict) -> ModelType:
        db_obj = self.model(**obj_in)
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj
    
    async def update(self, id: int, obj_in: dict) -> Optional[ModelType]:
        await self.db.execute(
            update(self.model)
            .where(self.model.id == id)
            .values(**obj_in)
        )
        await self.db.commit()
        return await self.get(id)
    
    async def delete(self, id: int) -> bool:
        result = await self.db.execute(
            delete(self.model).where(self.model.id == id)
        )
        await self.db.commit()
        return result.rowcount > 0
```

## 🔐 安全架构

### JWT认证流程
1. **登录验证**: 用户名/密码验证
2. **Token生成**: 生成Access Token和Refresh Token
3. **Token验证**: 中间件验证Token有效性
4. **权限检查**: 基于角色和权限的访问控制
5. **Token刷新**: 自动刷新过期Token

### 权限控制模型
- **用户(User)**: 系统使用者
- **角色(Role)**: 权限集合
- **权限(Permission)**: 具体操作权限
- **资源(Resource)**: 受保护的系统资源

## 📊 性能优化策略

### 数据库优化
- **连接池管理**: 合理配置连接池大小
- **查询优化**: 使用索引和查询优化
- **分页查询**: 避免大量数据查询
- **缓存策略**: Redis缓存热点数据

### API优化
- **异步处理**: 全面使用异步操作
- **响应压缩**: Gzip压缩响应数据
- **请求限流**: 防止API滥用
- **监控告警**: 实时性能监控

## 🧪 测试策略

### 测试层级
1. **单元测试**: 函数和方法测试
2. **集成测试**: 模块间交互测试
3. **API测试**: 接口功能测试
4. **端到端测试**: 完整流程测试

### 测试工具
- **pytest**: 测试框架
- **pytest-asyncio**: 异步测试支持
- **httpx**: HTTP客户端测试
- **factory-boy**: 测试数据工厂

## 📈 监控和日志

### 日志策略
- **结构化日志**: JSON格式日志
- **日志级别**: DEBUG/INFO/WARNING/ERROR
- **日志轮转**: 按大小和时间轮转
- **集中收集**: ELK Stack日志收集

### 监控指标
- **应用指标**: 响应时间、错误率、吞吐量
- **系统指标**: CPU、内存、磁盘、网络
- **业务指标**: 用户活跃度、功能使用率
- **数据库指标**: 连接数、查询性能、锁等待

## 🚀 部署架构

### 容器化部署
- **多阶段构建**: 优化镜像大小
- **健康检查**: 容器健康状态监控
- **资源限制**: CPU和内存限制
- **环境隔离**: 开发/测试/生产环境分离

### 负载均衡
- **Nginx**: 反向代理和负载均衡
- **SSL终止**: HTTPS证书管理
- **静态文件**: 静态资源服务
- **缓存策略**: 浏览器和代理缓存

## 📋 实施检查清单

### 开发阶段
- [ ] 项目结构搭建
- [ ] 核心模块开发
- [ ] API接口实现
- [ ] 单元测试编写
- [ ] 集成测试验证

### 测试阶段
- [ ] 功能测试完成
- [ ] 性能测试通过
- [ ] 安全测试验证
- [ ] 兼容性测试
- [ ] 压力测试评估

### 部署阶段
- [ ] 容器镜像构建
- [ ] 环境配置验证
- [ ] 数据库迁移
- [ ] 监控配置
- [ ] 备份策略实施 
