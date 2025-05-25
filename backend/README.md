# Enterprise Admin System Backend

基于 FastAPI 的企业后台管理系统后端 API，提供完整的用户认证、权限管理和业务功能。

## 🚀 技术栈

- **API 框架**: FastAPI + Python 3.11+
- **数据库**: PostgreSQL 15+ + SQLAlchemy 2.0
- **缓存**: Redis 7+
- **认证**: JWT + OAuth2
- **迁移**: Alembic
- **包管理**: uv
- **测试**: pytest + httpx

## 📦 项目结构

```
backend/
├── app/                    # 应用核心代码
│   ├── api/               # API 路由
│   │   └── auth.py        # 认证相关路由
│   ├── core/              # 核心配置和工具
│   │   ├── config.py      # 应用配置
│   │   ├── database.py    # 数据库连接
│   │   ├── redis.py       # Redis 连接
│   │   ├── security.py    # 安全工具
│   │   └── deps.py        # 依赖注入
│   ├── models/            # 数据库模型
│   │   ├── base.py        # 基础模型
│   │   └── user.py        # 用户相关模型
│   ├── schemas/           # Pydantic 模式
│   │   ├── common.py      # 通用模式
│   │   ├── auth.py        # 认证模式
│   │   └── user.py        # 用户模式
│   └── services/          # 业务逻辑层
│       ├── auth.py        # 认证服务
│       └── user.py        # 用户服务
├── alembic/               # 数据库迁移
├── scripts/               # 脚本文件
│   ├── init_db.py         # 数据库初始化
│   └── start.sh           # 启动脚本
├── tests/                 # 测试文件
├── main.py                # FastAPI 应用入口
├── pyproject.toml         # 项目配置
├── alembic.ini            # Alembic 配置
└── env.example            # 环境变量示例
```

## 🛠️ 快速开始

### 1. 环境要求

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- uv (推荐) 或 pip

### 2. 安装依赖

```bash
# 使用 uv (推荐)
pip install uv
uv pip install -e .[dev]

# 或使用 pip
pip install -e .[dev]
```

### 3. 环境配置

```bash
# 复制环境变量文件
cp env.example .env

# 编辑环境变量
vim .env
```

### 4. 数据库设置

```bash
# 启动 PostgreSQL 和 Redis (使用 Docker)
docker-compose up -d postgres redis

# 运行数据库迁移
alembic upgrade head

# 初始化数据库数据
python scripts/init_db.py
```

### 5. 启动应用

```bash
# 开发模式
uvicorn main:app --reload

# 或使用启动脚本
./scripts/start.sh
```

### 6. 访问应用

- API 文档: http://localhost:8000/docs
- ReDoc 文档: http://localhost:8000/redoc
- 健康检查: http://localhost:8000/health

## 🔐 默认账户

系统初始化后会创建以下默认账户：

### 超级管理员
- **用户名**: admin
- **密码**: Admin123!
- **邮箱**: admin@enterprise.com
- **权限**: 所有系统权限

### 演示用户
- **用户名**: john_doe / **密码**: User123!
- **用户名**: jane_smith / **密码**: Admin123!
- **用户名**: bob_wilson / **密码**: User123!

## 📚 API 文档

### 认证接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/refresh` | 刷新令牌 |
| POST | `/api/auth/logout` | 用户登出 |
| GET | `/api/auth/me` | 获取当前用户信息 |
| POST | `/api/auth/password-reset-request` | 请求密码重置 |
| POST | `/api/auth/password-reset` | 重置密码 |

### 请求示例

```bash
# 用户登录
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!",
    "remember_me": false
  }'

# 获取当前用户信息
curl -X GET "http://localhost:8000/api/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🗄️ 数据库

### 核心表结构

- **user**: 用户信息表
- **role**: 角色表
- **permission**: 权限表
- **user_roles**: 用户角色关联表
- **role_permissions**: 角色权限关联表

### 迁移管理

```bash
# 创建新迁移
alembic revision --autogenerate -m "描述"

# 应用迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1

# 查看迁移历史
alembic history
```

## 🧪 测试

```bash
# 运行所有测试
pytest

# 运行特定测试
pytest tests/test_auth.py

# 生成覆盖率报告
pytest --cov=app tests/
```

## 🔧 开发工具

### 代码格式化

```bash
# 格式化代码
black .

# 排序导入
isort .

# 类型检查
mypy app/
```

### 代码检查

```bash
# 代码风格检查
flake8 app/
```

## 🐳 Docker 部署

### 开发环境

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f backend

# 停止服务
docker-compose down
```

### 生产环境

```bash
# 构建生产镜像
docker build -t enterprise-admin-backend .

# 运行容器
docker run -d \
  --name enterprise-backend \
  -p 8000:8000 \
  -e DATABASE_URL="your-database-url" \
  -e REDIS_URL="your-redis-url" \
  -e SECRET_KEY="your-secret-key" \
  enterprise-admin-backend
```

## 📊 监控和日志

### 健康检查

```bash
curl http://localhost:8000/health
```

### 日志配置

日志级别可通过环境变量 `LOG_LEVEL` 配置：
- DEBUG: 详细调试信息
- INFO: 一般信息 (默认)
- WARNING: 警告信息
- ERROR: 错误信息

## 🔒 安全配置

### JWT 配置

- 访问令牌有效期: 30 分钟 (可配置)
- 刷新令牌有效期: 7 天 (可配置)
- 算法: HS256

### 密码策略

- 最少 8 个字符
- 包含大写字母
- 包含小写字母
- 包含数字

### CORS 配置

默认允许的源：
- http://localhost:5173 (前端开发服务器)
- http://localhost:3000 (备用前端端口)

## 🚀 部署指南

### 环境变量

生产环境必须配置的环境变量：

```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db
REDIS_URL=redis://host:port/db
SECRET_KEY=your-very-secure-secret-key
DEBUG=false
ALLOWED_ORIGINS=["https://yourdomain.com"]
```

### 性能优化

- 使用连接池
- 启用 Redis 缓存
- 配置适当的工作进程数
- 使用 Nginx 反向代理

## 📝 更新日志

### v1.0.0 (2024-01-XX)

- ✅ 基础 FastAPI 应用架构
- ✅ 用户认证和授权系统
- ✅ RBAC 权限管理
- ✅ JWT 令牌认证
- ✅ 数据库迁移系统
- ✅ Redis 缓存集成
- ✅ Docker 容器化支持
- ✅ API 文档自动生成

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请：

1. 查看 [API 文档](http://localhost:8000/docs)
2. 提交 [Issue](https://github.com/your-repo/issues)
3. 联系开发团队
