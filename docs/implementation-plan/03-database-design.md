# 数据库设计方案

## 🗄️ 数据库概述

### 设计原则
- **规范化设计**: 减少数据冗余
- **性能优化**: 合理的索引策略
- **扩展性**: 支持业务增长
- **数据完整性**: 约束和验证
- **安全性**: 敏感数据保护

### 技术选择
- **数据库**: PostgreSQL 15+
- **ORM**: SQLAlchemy 2.0
- **迁移工具**: Alembic
- **连接池**: asyncpg
- **缓存**: Redis 7+

## 📊 数据模型设计

### 核心实体关系图
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │    │    Role     │    │ Permission  │
│             │    │             │    │             │
│ id (PK)     │    │ id (PK)     │    │ id (PK)     │
│ username    │    │ name        │    │ name        │
│ email       │    │ description │    │ resource    │
│ password    │    │ is_active   │    │ action      │
│ ...         │    │ ...         │    │ ...         │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │                   │                   │
       └───────┐    ┌──────┴──────┐    ┌──────┘
               │    │             │    │
               ▼    ▼             ▼    ▼
        ┌─────────────┐    ┌─────────────┐
        │ UserRole    │    │RolePermission│
        │             │    │             │
        │ user_id(FK) │    │ role_id(FK) │
        │ role_id(FK) │    │ perm_id(FK) │
        │ assigned_at │    │ granted_at  │
        │ assigned_by │    │ granted_by  │
        └─────────────┘    └─────────────┘
```

## 🏗️ 表结构设计

### 1. 用户表 (users)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    avatar_url VARCHAR(255),
    department VARCHAR(100),
    position VARCHAR(100),
    birthday DATE,
    work_location VARCHAR(100),
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引
    INDEX idx_users_username (username),
    INDEX idx_users_email (email),
    INDEX idx_users_department (department),
    INDEX idx_users_is_active (is_active),
    INDEX idx_users_created_at (created_at)
);
```

### 2. 角色表 (roles)
```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    
    -- 索引
    INDEX idx_roles_name (name),
    INDEX idx_roles_level (level),
    INDEX idx_roles_is_active (is_active)
);
```

### 3. 权限表 (permissions)
```sql
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    conditions JSONB,
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引
    INDEX idx_permissions_name (name),
    INDEX idx_permissions_resource (resource),
    INDEX idx_permissions_action (action),
    INDEX idx_permissions_resource_action (resource, action),
    INDEX idx_permissions_is_active (is_active)
);
```

### 4. 用户角色关联表 (user_roles)
```sql
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER REFERENCES users(id),
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 唯一约束
    UNIQUE(user_id, role_id),
    
    -- 索引
    INDEX idx_user_roles_user_id (user_id),
    INDEX idx_user_roles_role_id (role_id),
    INDEX idx_user_roles_is_active (is_active),
    INDEX idx_user_roles_expires_at (expires_at)
);
```

### 5. 角色权限关联表 (role_permissions)
```sql
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INTEGER REFERENCES users(id),
    conditions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 唯一约束
    UNIQUE(role_id, permission_id),
    
    -- 索引
    INDEX idx_role_permissions_role_id (role_id),
    INDEX idx_role_permissions_permission_id (permission_id),
    INDEX idx_role_permissions_is_active (is_active)
);
```

### 6. 审计日志表 (audit_logs)
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引
    INDEX idx_audit_logs_user_id (user_id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_resource (resource_type, resource_id),
    INDEX idx_audit_logs_created_at (created_at),
    INDEX idx_audit_logs_session_id (session_id)
);
```

### 7. 会话表 (user_sessions)
```sql
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引
    INDEX idx_user_sessions_user_id (user_id),
    INDEX idx_user_sessions_session_token (session_token),
    INDEX idx_user_sessions_refresh_token (refresh_token),
    INDEX idx_user_sessions_expires_at (expires_at),
    INDEX idx_user_sessions_is_active (is_active)
);
```

### 8. 文件上传表 (file_uploads)
```sql
CREATE TABLE file_uploads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    file_hash VARCHAR(64),
    upload_type VARCHAR(50),
    is_public BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引
    INDEX idx_file_uploads_user_id (user_id),
    INDEX idx_file_uploads_file_hash (file_hash),
    INDEX idx_file_uploads_upload_type (upload_type),
    INDEX idx_file_uploads_created_at (created_at)
);
```

## 🔧 SQLAlchemy模型定义

### 用户模型 (models/user.py)
```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import BaseModel

class User(BaseModel):
    __tablename__ = "users"
    
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(50))
    last_name = Column(String(50))
    phone = Column(String(20))
    avatar_url = Column(String(255))
    department = Column(String(100), index=True)
    position = Column(String(100))
    birthday = Column(Date)
    work_location = Column(String(100))
    bio = Column(Text)
    is_verified = Column(Boolean, default=False)
    last_login_at = Column(DateTime)
    
    # 关系
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    file_uploads = relationship("FileUpload", back_populates="user")
    
    @property
    def full_name(self) -> str:
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username
    
    @property
    def roles(self):
        return [ur.role for ur in self.user_roles if ur.is_active]
```

### 角色模型 (models/role.py)
```python
from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Role(BaseModel):
    __tablename__ = "roles"
    
    name = Column(String(50), unique=True, nullable=False, index=True)
    display_name = Column(String(100), nullable=False)
    description = Column(Text)
    level = Column(Integer, default=0, index=True)
    is_system = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    
    # 关系
    user_roles = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")
    role_permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")
    
    @property
    def permissions(self):
        return [rp.permission for rp in self.role_permissions if rp.is_active]
    
    @property
    def users(self):
        return [ur.user for ur in self.user_roles if ur.is_active]
```

### 权限模型 (models/permission.py)
```python
from sqlalchemy import Column, String, Boolean, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Permission(BaseModel):
    __tablename__ = "permissions"
    
    name = Column(String(100), unique=True, nullable=False, index=True)
    display_name = Column(String(100), nullable=False)
    description = Column(Text)
    resource = Column(String(50), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)
    conditions = Column(JSONB)
    is_system = Column(Boolean, default=False)
    
    # 关系
    role_permissions = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")
    
    @property
    def roles(self):
        return [rp.role for rp in self.role_permissions if rp.is_active]
```

## 📈 数据库优化策略

### 索引策略
```sql
-- 复合索引
CREATE INDEX idx_users_department_active ON users(department, is_active);
CREATE INDEX idx_user_roles_user_active ON user_roles(user_id, is_active);
CREATE INDEX idx_role_permissions_role_active ON role_permissions(role_id, is_active);

-- 部分索引
CREATE INDEX idx_users_active_verified ON users(id) WHERE is_active = TRUE AND is_verified = TRUE;
CREATE INDEX idx_sessions_active ON user_sessions(user_id, expires_at) WHERE is_active = TRUE;

-- 表达式索引
CREATE INDEX idx_users_full_name ON users(LOWER(first_name || ' ' || last_name));
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
```

### 查询优化
```sql
-- 用户权限查询优化
CREATE MATERIALIZED VIEW user_permissions AS
SELECT 
    u.id as user_id,
    u.username,
    p.id as permission_id,
    p.name as permission_name,
    p.resource,
    p.action
FROM users u
JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
JOIN roles r ON ur.role_id = r.id AND r.is_active = TRUE
JOIN role_permissions rp ON r.id = rp.role_id AND rp.is_active = TRUE
JOIN permissions p ON rp.permission_id = p.id AND p.is_active = TRUE
WHERE u.is_active = TRUE;

-- 创建唯一索引
CREATE UNIQUE INDEX idx_user_permissions_unique ON user_permissions(user_id, permission_id);
```

### 分区策略
```sql
-- 审计日志按月分区
CREATE TABLE audit_logs_y2024m01 PARTITION OF audit_logs
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_y2024m02 PARTITION OF audit_logs
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

## 🔄 数据迁移方案

### Alembic配置 (alembic.ini)
```ini
[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os
sqlalchemy.url = postgresql+asyncpg://user:pass@localhost/dbname

[post_write_hooks]
hooks = black
black.type = console_scripts
black.entrypoint = black
black.options = -l 79 REVISION_SCRIPT_FILENAME
```

### 初始迁移脚本
```python
"""Initial migration

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 创建用户表
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        # ... 其他字段
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('email')
    )
    
    # 创建索引
    op.create_index('idx_users_username', 'users', ['username'])
    op.create_index('idx_users_email', 'users', ['email'])
    
    # ... 其他表创建

def downgrade() -> None:
    op.drop_table('users')
    # ... 其他表删除
```

## 🔒 数据安全策略

### 敏感数据加密
```python
from cryptography.fernet import Fernet
from sqlalchemy_utils import EncryptedType
from sqlalchemy_utils.types.encrypted.encrypted_type import AesEngine

class User(BaseModel):
    # 加密敏感字段
    phone = Column(EncryptedType(String, secret_key, AesEngine, 'pkcs5'))
    id_number = Column(EncryptedType(String, secret_key, AesEngine, 'pkcs5'))
```

### 行级安全策略
```sql
-- 启用行级安全
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的数据
CREATE POLICY user_self_access ON users
    FOR ALL TO app_user
    USING (id = current_setting('app.current_user_id')::INTEGER);

-- 管理员可以访问所有数据
CREATE POLICY admin_full_access ON users
    FOR ALL TO app_admin
    USING (true);
```

### 数据备份策略
```bash
#!/bin/bash
# 数据库备份脚本

DB_NAME="enterprise_db"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 全量备份
pg_dump -h localhost -U postgres -d $DB_NAME \
    --format=custom \
    --compress=9 \
    --file="$BACKUP_DIR/full_backup_$DATE.dump"

# 增量备份（WAL归档）
pg_receivewal -h localhost -U postgres \
    --directory="$BACKUP_DIR/wal" \
    --compress=9
```

## 📊 性能监控

### 慢查询监控
```sql
-- 启用慢查询日志
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;

-- 查询统计信息
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

### 连接池监控
```python
from sqlalchemy import event
from sqlalchemy.pool import Pool
import logging

logger = logging.getLogger(__name__)

@event.listens_for(Pool, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    logger.info(f"New database connection established: {dbapi_connection}")

@event.listens_for(Pool, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    logger.debug(f"Connection checked out from pool")

@event.listens_for(Pool, "checkin")
def receive_checkin(dbapi_connection, connection_record):
    logger.debug(f"Connection checked in to pool")
```

## 📋 实施检查清单

### 数据库设计阶段
- [ ] 实体关系图设计完成
- [ ] 表结构设计验证
- [ ] 索引策略制定
- [ ] 约束和触发器定义
- [ ] 安全策略规划

### 开发阶段
- [ ] SQLAlchemy模型实现
- [ ] Alembic迁移脚本
- [ ] 数据库连接配置
- [ ] 查询优化实施
- [ ] 测试数据准备

### 部署阶段
- [ ] 数据库环境搭建
- [ ] 迁移脚本执行
- [ ] 性能基准测试
- [ ] 备份策略实施
- [ ] 监控配置完成

### 维护阶段
- [ ] 定期性能分析
- [ ] 索引优化调整
- [ ] 数据清理策略
- [ ] 容量规划评估
- [ ] 安全审计检查 
