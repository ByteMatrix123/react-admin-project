# API接口规范设计

## 🌐 API概述

### 设计原则
- **RESTful设计**: 遵循REST架构风格
- **版本控制**: 支持API版本管理
- **统一响应**: 标准化响应格式
- **错误处理**: 完善的错误码体系
- **文档自动生成**: OpenAPI/Swagger文档

### 技术规范
- **协议**: HTTP/HTTPS
- **格式**: JSON
- **认证**: JWT Bearer Token
- **编码**: UTF-8
- **压缩**: Gzip

## 📋 API版本管理

### 版本策略
```
/api/v1/users          # 版本1
/api/v2/users          # 版本2（向后兼容）
```

### 版本控制头
```http
Accept: application/vnd.api+json;version=1
API-Version: v1
```

## 🔐 认证授权

### JWT Token结构
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": 123,
    "username": "admin",
    "roles": ["admin", "user"],
    "permissions": ["user:read", "user:write"],
    "exp": 1640995200,
    "iat": 1640908800,
    "jti": "unique-token-id"
  }
}
```

### 认证流程
```http
# 1. 登录获取Token
POST /api/v1/auth/login
Authorization: Basic base64(username:password)

# 2. 使用Token访问API
GET /api/v1/users
Authorization: Bearer <access_token>

# 3. 刷新Token
POST /api/v1/auth/refresh
Authorization: Bearer <refresh_token>
```

## 📊 统一响应格式

### 成功响应
```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {
    // 具体数据
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "request_id": "req-123456",
    "version": "v1"
  }
}
```

### 分页响应
```json
{
  "success": true,
  "code": 200,
  "message": "查询成功",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100,
      "total_pages": 5,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 错误响应
```json
{
  "success": false,
  "code": 400,
  "message": "请求参数错误",
  "error": {
    "type": "ValidationError",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确",
        "code": "INVALID_EMAIL"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "request_id": "req-123456"
  }
}
```

## 🔑 认证接口

### 用户登录
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123",
  "remember_me": true
}

# 响应
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 1800,
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "roles": ["admin"]
    }
  }
}
```

### 用户注册
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "first_name": "张",
  "last_name": "三",
  "department": "技术部"
}

# 响应
{
  "success": true,
  "message": "注册成功，请验证邮箱",
  "data": {
    "user_id": 123,
    "verification_required": true
  }
}
```

### Token刷新
```http
POST /api/v1/auth/refresh
Authorization: Bearer <refresh_token>

# 响应
{
  "success": true,
  "data": {
    "access_token": "new_access_token",
    "expires_in": 1800
  }
}
```

### 用户登出
```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>

# 响应
{
  "success": true,
  "message": "登出成功"
}
```

### 获取当前用户信息
```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>

# 响应
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "first_name": "管理员",
    "last_name": "",
    "avatar_url": "https://example.com/avatar.jpg",
    "department": "技术部",
    "position": "系统管理员",
    "roles": ["admin"],
    "permissions": ["user:read", "user:write", "role:manage"],
    "last_login_at": "2024-01-01T10:00:00Z"
  }
}
```

## 👥 用户管理接口

### 获取用户列表
```http
GET /api/v1/users?page=1&page_size=20&search=张三&department=技术部&is_active=true&sort=created_at&order=desc
Authorization: Bearer <access_token>

# 响应
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "username": "zhangsan",
        "email": "zhangsan@example.com",
        "first_name": "张",
        "last_name": "三",
        "department": "技术部",
        "position": "开发工程师",
        "is_active": true,
        "is_verified": true,
        "created_at": "2024-01-01T00:00:00Z",
        "last_login_at": "2024-01-01T10:00:00Z",
        "roles": ["user", "developer"]
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

### 获取用户详情
```http
GET /api/v1/users/123
Authorization: Bearer <access_token>

# 响应
{
  "success": true,
  "data": {
    "id": 123,
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "first_name": "张",
    "last_name": "三",
    "phone": "13800138000",
    "avatar_url": "https://example.com/avatar.jpg",
    "department": "技术部",
    "position": "开发工程师",
    "birthday": "1990-01-01",
    "work_location": "北京",
    "bio": "资深开发工程师",
    "is_active": true,
    "is_verified": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z",
    "last_login_at": "2024-01-01T10:00:00Z",
    "roles": [
      {
        "id": 2,
        "name": "developer",
        "display_name": "开发人员",
        "assigned_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 创建用户
```http
POST /api/v1/users
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "first_name": "新",
  "last_name": "用户",
  "phone": "13800138001",
  "department": "技术部",
  "position": "实习生",
  "role_ids": [2, 3]
}

# 响应
{
  "success": true,
  "message": "用户创建成功",
  "data": {
    "id": 124,
    "username": "newuser",
    "email": "newuser@example.com"
  }
}
```

### 更新用户
```http
PUT /api/v1/users/123
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "first_name": "张",
  "last_name": "三丰",
  "phone": "13800138002",
  "department": "技术部",
  "position": "高级工程师"
}

# 响应
{
  "success": true,
  "message": "用户更新成功",
  "data": {
    "id": 123,
    "updated_at": "2024-01-01T12:30:00Z"
  }
}
```

### 删除用户
```http
DELETE /api/v1/users/123
Authorization: Bearer <access_token>

# 响应
{
  "success": true,
  "message": "用户删除成功"
}
```

### 批量删除用户
```http
DELETE /api/v1/users/batch
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "user_ids": [123, 124, 125]
}

# 响应
{
  "success": true,
  "message": "批量删除成功",
  "data": {
    "deleted_count": 3,
    "failed_ids": []
  }
}
```

### 重置用户密码
```http
POST /api/v1/users/123/reset-password
Authorization: Bearer <access_token>

# 响应
{
  "success": true,
  "message": "密码重置成功",
  "data": {
    "temporary_password": "temp123456"
  }
}
```

## 🎭 角色管理接口

### 获取角色列表
```http
GET /api/v1/roles?page=1&page_size=20&search=管理员&is_active=true
Authorization: Bearer <access_token>

# 响应
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "admin",
        "display_name": "系统管理员",
        "description": "拥有系统所有权限",
        "level": 100,
        "is_system": true,
        "is_active": true,
        "user_count": 2,
        "permission_count": 15,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 5
    }
  }
}
```

### 获取角色详情
```http
GET /api/v1/roles/1
Authorization: Bearer <access_token>

# 响应
{
  "success": true,
  "data": {
    "id": 1,
    "name": "admin",
    "display_name": "系统管理员",
    "description": "拥有系统所有权限",
    "level": 100,
    "is_system": true,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "permissions": [
      {
        "id": 1,
        "name": "user:read",
        "display_name": "查看用户",
        "resource": "user",
        "action": "read"
      }
    ],
    "users": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com"
      }
    ]
  }
}
```

### 创建角色
```http
POST /api/v1/roles
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "editor",
  "display_name": "编辑员",
  "description": "内容编辑权限",
  "level": 50,
  "permission_ids": [1, 2, 3]
}

# 响应
{
  "success": true,
  "message": "角色创建成功",
  "data": {
    "id": 6,
    "name": "editor",
    "display_name": "编辑员"
  }
}
```

### 更新角色
```http
PUT /api/v1/roles/6
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "display_name": "高级编辑员",
  "description": "高级内容编辑权限",
  "level": 60
}

# 响应
{
  "success": true,
  "message": "角色更新成功"
}
```

### 删除角色
```http
DELETE /api/v1/roles/6
Authorization: Bearer <access_token>

# 响应
{
  "success": true,
  "message": "角色删除成功"
}
```

### 分配角色权限
```http
POST /api/v1/roles/6/permissions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "permission_ids": [1, 2, 3, 4]
}

# 响应
{
  "success": true,
  "message": "权限分配成功",
  "data": {
    "assigned_count": 4
  }
}
```

### 移除角色权限
```http
DELETE /api/v1/roles/6/permissions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "permission_ids": [3, 4]
}

# 响应
{
  "success": true,
  "message": "权限移除成功",
  "data": {
    "removed_count": 2
  }
}
```

## 🔐 权限管理接口

### 获取权限列表
```http
GET /api/v1/permissions?page=1&page_size=20&resource=user&action=read
Authorization: Bearer <access_token>

# 响应
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "user:read",
        "display_name": "查看用户",
        "description": "查看用户信息的权限",
        "resource": "user",
        "action": "read",
        "is_system": true,
        "is_active": true,
        "role_count": 3,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 15
    }
  }
}
```

### 获取权限树
```http
GET /api/v1/permissions/tree
Authorization: Bearer <access_token>

# 响应
{
  "success": true,
  "data": [
    {
      "resource": "user",
      "display_name": "用户管理",
      "permissions": [
        {
          "id": 1,
          "name": "user:read",
          "display_name": "查看用户",
          "action": "read"
        },
        {
          "id": 2,
          "name": "user:write",
          "display_name": "编辑用户",
          "action": "write"
        }
      ]
    }
  ]
}
```

### 创建权限
```http
POST /api/v1/permissions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "content:publish",
  "display_name": "发布内容",
  "description": "发布和管理内容的权限",
  "resource": "content",
  "action": "publish"
}

# 响应
{
  "success": true,
  "message": "权限创建成功",
  "data": {
    "id": 16,
    "name": "content:publish"
  }
}
```

### 更新权限
```http
PUT /api/v1/permissions/16
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "display_name": "发布和审核内容",
  "description": "发布、审核和管理内容的权限"
}

# 响应
{
  "success": true,
  "message": "权限更新成功"
}
```

### 删除权限
```http
DELETE /api/v1/permissions/16
Authorization: Bearer <access_token>

# 响应
{
  "success": true,
  "message": "权限删除成功"
}
```

## 👤 用户角色分配接口

### 获取用户角色
```http
GET /api/v1/users/123/roles
Authorization: Bearer <access_token>

# 响应
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "developer",
      "display_name": "开发人员",
      "assigned_at": "2024-01-01T00:00:00Z",
      "assigned_by": {
        "id": 1,
        "username": "admin"
      },
      "expires_at": null,
      "is_active": true
    }
  ]
}
```

### 分配用户角色
```http
POST /api/v1/users/123/roles
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "role_ids": [2, 3],
  "expires_at": "2024-12-31T23:59:59Z"
}

# 响应
{
  "success": true,
  "message": "角色分配成功",
  "data": {
    "assigned_count": 2
  }
}
```

### 移除用户角色
```http
DELETE /api/v1/users/123/roles
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "role_ids": [3]
}

# 响应
{
  "success": true,
  "message": "角色移除成功",
  "data": {
    "removed_count": 1
  }
}
```

## 📁 文件上传接口

### 上传文件
```http
POST /api/v1/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <binary_data>
upload_type: avatar
is_public: true

# 响应
{
  "success": true,
  "message": "文件上传成功",
  "data": {
    "id": 1,
    "file_name": "avatar_123_20240101.jpg",
    "file_url": "https://example.com/uploads/avatar_123_20240101.jpg",
    "file_size": 102400,
    "mime_type": "image/jpeg",
    "upload_type": "avatar"
  }
}
```

### 获取文件信息
```http
GET /api/v1/upload/1
Authorization: Bearer <access_token>

# 响应
{
  "success": true,
  "data": {
    "id": 1,
    "original_name": "avatar.jpg",
    "file_name": "avatar_123_20240101.jpg",
    "file_url": "https://example.com/uploads/avatar_123_20240101.jpg",
    "file_size": 102400,
    "mime_type": "image/jpeg",
    "upload_type": "avatar",
    "is_public": true,
    "created_at": "2024-01-01T10:00:00Z"
  }
}
```

### 删除文件
```http
DELETE /api/v1/upload/1
Authorization: Bearer <access_token>

# 响应
{
  "success": true,
  "message": "文件删除成功"
}
```

## 📊 统计分析接口

### 获取仪表盘统计
```http
GET /api/v1/dashboard/stats
Authorization: Bearer <access_token>

# 响应
{
  "success": true,
  "data": {
    "user_stats": {
      "total_users": 1250,
      "active_users": 1180,
      "new_users_today": 15,
      "new_users_this_month": 120
    },
    "role_stats": {
      "total_roles": 8,
      "system_roles": 5,
      "custom_roles": 3
    },
    "permission_stats": {
      "total_permissions": 25,
      "system_permissions": 20,
      "custom_permissions": 5
    },
    "activity_stats": {
      "login_count_today": 450,
      "active_sessions": 280,
      "failed_login_attempts": 12
    }
  }
}
```

### 获取用户增长趋势
```http
GET /api/v1/dashboard/user-growth?period=30d
Authorization: Bearer <access_token>

# 响应
{
  "success": true,
  "data": {
    "period": "30d",
    "data_points": [
      {
        "date": "2024-01-01",
        "new_users": 15,
        "total_users": 1200
      },
      {
        "date": "2024-01-02",
        "new_users": 12,
        "total_users": 1212
      }
    ]
  }
}
```

## 📝 审计日志接口

### 获取审计日志
```http
GET /api/v1/audit-logs?page=1&page_size=20&user_id=123&action=create&resource_type=user&start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <access_token>

# 响应
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "user": {
          "id": 1,
          "username": "admin"
        },
        "action": "create",
        "resource_type": "user",
        "resource_id": 123,
        "old_values": null,
        "new_values": {
          "username": "newuser",
          "email": "newuser@example.com"
        },
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2024-01-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 500
    }
  }
}
```

## ❌ 错误码定义

### HTTP状态码
- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 权限不足
- `404` - 资源不存在
- `409` - 资源冲突
- `422` - 数据验证失败
- `429` - 请求频率限制
- `500` - 服务器内部错误

### 业务错误码
```json
{
  "AUTH_001": "用户名或密码错误",
  "AUTH_002": "账户已被锁定",
  "AUTH_003": "Token已过期",
  "AUTH_004": "Token无效",
  "AUTH_005": "权限不足",
  
  "USER_001": "用户名已存在",
  "USER_002": "邮箱已存在",
  "USER_003": "用户不存在",
  "USER_004": "密码格式不正确",
  
  "ROLE_001": "角色名已存在",
  "ROLE_002": "角色不存在",
  "ROLE_003": "系统角色不能删除",
  
  "PERM_001": "权限名已存在",
  "PERM_002": "权限不存在",
  "PERM_003": "系统权限不能删除",
  
  "FILE_001": "文件类型不支持",
  "FILE_002": "文件大小超限",
  "FILE_003": "文件上传失败"
}
```

## 📋 实施检查清单

### API设计阶段
- [ ] RESTful接口设计
- [ ] 请求响应格式定义
- [ ] 错误码体系设计
- [ ] 认证授权方案
- [ ] 接口文档编写

### 开发阶段
- [ ] FastAPI路由实现
- [ ] Pydantic模型定义
- [ ] 中间件开发
- [ ] 异常处理实现
- [ ] 接口测试编写

### 测试阶段
- [ ] 单元测试覆盖
- [ ] 集成测试验证
- [ ] 性能测试评估
- [ ] 安全测试检查
- [ ] 文档测试验证

### 部署阶段
- [ ] API文档生成
- [ ] 接口监控配置
- [ ] 限流策略实施
- [ ] 日志记录配置
- [ ] 错误追踪设置 
