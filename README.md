# 企业后台管理系统

一个基于 React + TypeScript 的现代化企业后台管理系统框架，采用最新的技术栈和最佳实践。

## 🚀 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 6
- **UI 组件库**: Ant Design 5
- **状态管理**: Zustand
- **数据获取**: TanStack Query (React Query)
- **路由管理**: TanStack Router (文件路由)
- **样式方案**: CSS-in-JS + Ant Design 主题
- **代码规范**: ESLint + TypeScript

## 📦 项目结构

```
enterprise-admin-system/
├── frontend/           # 前端应用
│   ├── src/
│   │   ├── components/          # 通用组件
│   │   │   ├── UserForm.tsx    # 用户表单组件
│   │   │   └── UserDetail.tsx  # 用户详情组件
│   │   ├── pages/              # 页面组件
│   │   │   ├── Dashboard.tsx   # 仪表盘页面
│   │   │   └── UserManagement.tsx # 用户管理页面
│   │   ├── layouts/            # 布局组件
│   │   │   └── MainLayout.tsx  # 主布局
│   │   ├── routes/             # 路由配置 (文件路由)
│   │   │   ├── __root.tsx      # 根路由
│   │   │   ├── index.tsx       # 首页路由
│   │   │   ├── dashboard.tsx   # 仪表盘路由
│   │   │   └── users.tsx       # 用户管理路由
│   │   ├── stores/             # 状态管理
│   │   │   ├── appStore.ts     # 应用全局状态
│   │   │   └── userStore.ts    # 用户状态
│   │   ├── services/           # API 服务
│   │   │   ├── userService.ts  # 用户 API
│   │   │   └── authService.ts  # 认证 API
│   │   ├── hooks/              # 自定义 Hooks
│   │   │   └── useUserQuery.ts # 用户查询 Hooks
│   │   ├── types/              # 类型定义
│   │   │   ├── user.ts         # 用户类型
│   │   │   └── common.ts       # 通用类型
│   │   └── utils/              # 工具函数
│   ├── public/                 # 静态资源
│   ├── package.json           # 前端依赖配置
│   └── README.md              # 前端文档
├── backend/                   # 后端应用
│   ├── app/                  # 应用代码
│   │   ├── api/             # API路由
│   │   ├── core/            # 核心配置
│   │   ├── models/          # 数据模型
│   │   ├── schemas/         # Pydantic模式
│   │   ├── services/        # 业务逻辑
│   │   └── utils/           # 工具函数
│   ├── alembic/             # 数据库迁移
│   ├── scripts/             # 脚本文件
│   ├── tests/               # 测试文件
│   └── README.md            # 后端文档
├── docs/                     # 项目文档
├── docker-compose.yml        # Docker配置
└── README.md                # 项目总体说明
```

## ✨ 功能特性

### 🎯 核心功能
- **身份验证**: 用户登录、注册、JWT Token 管理
- **RBAC权限管理**: 完整的基于角色的访问控制系统
- **个人资料**: 头像上传、信息编辑、密码修改
- **系统设置**: 界面、通知、隐私、安全设置
- **用户管理**: 完整的用户 CRUD 操作和角色分配
- **权限控制**: 基于角色的权限管理和路由保护
- **数据展示**: 响应式表格、搜索、筛选、分页
- **表单验证**: 完善的表单验证机制
- **状态管理**: 全局状态和本地状态管理

### 🎨 UI/UX 特性
- **响应式设计**: 适配各种屏幕尺寸
- **主题定制**: 支持主题切换
- **国际化**: 中文界面，支持扩展
- **交互反馈**: 加载状态、错误处理、成功提示
- **现代化界面**: 简洁美观的设计风格

### 🔧 技术特性
- **TypeScript**: 完整的类型安全
- **文件路由**: 基于文件系统的路由管理
- **数据缓存**: 智能的数据缓存和同步
- **错误边界**: 完善的错误处理机制
- **开发工具**: 集成开发调试工具

## 🛠️ 开发指南

### 环境要求
- Node.js >= 18
- npm >= 9

### 前端开发
```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint
```

### 后端开发
```bash
# 进入后端目录
cd backend

# 启动数据库服务
docker-compose up -d postgres redis

# 安装依赖并启动服务
uv run uvicorn main:app --reload
```

## 📋 功能模块

### 1. 身份验证
- **登录页面** (`/login`): 用户名/邮箱登录、记住我、表单验证
- **注册页面** (`/register`): 完整注册流程、实时验证、部门选择
- **路由保护**: 基于权限和角色的访问控制
- **会话管理**: JWT Token 和 Refresh Token

### 2. 个人资料 (`/profile`)
- **头像管理**: 上传、预览、格式验证
- **信息编辑**: 基本信息、联系方式、工作信息
- **密码修改**: 安全的密码更改功能
- **扩展信息**: 生日、地点、个人简介

### 3. 系统设置 (`/settings`)
- **界面设置**: 主题、语言、字体大小、侧边栏
- **通知设置**: 邮件、浏览器、手机推送、系统通知
- **隐私设置**: 在线状态、数据收集、使用数据分享
- **安全设置**: 双因素认证、会话超时、密码过期

### 4. 仪表盘 (`/dashboard`)
- 数据统计展示
- 用户增长趋势
- 系统状态监控
- 最近活动记录

### 5. 用户管理 (`/users`)
- 用户列表展示
- 用户信息搜索和筛选
- 用户创建和编辑
- 用户详情查看
- 用户状态管理
- 用户角色分配
- 密码重置

### 6. 权限管理 (`/permissions`)
- 权限列表查看
- 角色管理（创建、编辑、删除）
- 权限分配（为角色分配权限）
- 权限统计展示
- 操作审计日志
- 权限级别控制

## 🎯 最佳实践

### 1. 代码组织
- 按功能模块组织代码
- 统一的命名规范
- 清晰的文件结构

### 2. 状态管理
- 全局状态使用 Zustand
- 服务器状态使用 TanStack Query
- 本地状态使用 React useState

### 3. 类型安全
- 完整的 TypeScript 类型定义
- 严格的类型检查
- 接口和类型复用

### 4. 性能优化
- 组件懒加载
- 数据缓存策略
- 虚拟滚动（大数据量）
- 防抖和节流

### 5. 用户体验
- 加载状态指示
- 错误信息提示
- 操作确认对话框
- 响应式设计

## 🔄 数据流

```
用户操作 → 组件事件 → Hooks → API 服务 → 状态更新 → UI 重新渲染
```

### 状态管理流程
1. **UI 交互**: 用户在界面上进行操作
2. **事件处理**: 组件处理用户事件
3. **API 调用**: 通过 TanStack Query 调用 API
4. **状态更新**: 更新 Zustand 状态和查询缓存
5. **UI 更新**: React 重新渲染相关组件

## 🚀 部署

### 前端构建
```bash
cd frontend
npm run build
npm run preview
```

### 后端部署
```bash
cd backend
docker compose up -d
```

### 完整部署
```bash
# 使用 Docker Compose 部署整个应用
docker compose up -d
```

## 📝 开发规范

### 1. 组件开发
- 使用函数组件 + Hooks
- Props 类型定义
- 组件文档注释

### 2. API 集成
- 统一的错误处理
- 请求和响应类型定义
- 加载状态管理

### 3. 样式规范
- 使用 Ant Design 主题系统
- 响应式设计原则
- 一致的间距和颜色

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建 Pull Request

## 📋 实施计划

### 🚀 前后端分离改造方案
本项目提供了完整的前后端分离改造实施计划，包含详细的技术方案和实施步骤：

- **[📖 实施计划总览](./docs/implementation-plan/00-implementation-summary.md)** - 完整项目规划和时间线
- **[📚 详细实施文档](./docs/implementation-plan/README.md)** - 8个阶段的详细实施方案

### 🎯 改造目标
- **后端架构**: FastAPI + PostgreSQL + Redis 完整后端系统
- **API 设计**: RESTful API 和 OpenAPI 文档
- **安全策略**: JWT 认证、RBAC 权限、数据加密
- **部署方案**: Docker 容器化、Kubernetes 编排、CI/CD 流水线
- **监控运维**: Prometheus 监控、日志收集、告警系统

### 📊 实施时间线
- **第一阶段** (3周): 基础架构搭建
- **第二阶段** (4周): 功能迁移和优化  
- **第三阶段** (3周): 部署和运维

## 📄 许可证

MIT License

---

这个项目展示了如何构建一个现代化的企业后台管理系统，包含了完整的用户管理功能和最佳实践。可以作为其他管理系统的基础框架进行扩展。

**🔗 更多资源**:
- **[📚 文档中心](./docs/README.md)** - 完整的技术文档和指南
- **[✨ 功能特性](./docs/features/README.md)** - 系统功能详细说明
- **[🎯 功能演示](./docs/demos/README.md)** - 各功能的实际演示
- **[📋 开发指南](./docs/guides/README.md)** - 开发和集成指南
- **[🧪 测试文档](./docs/testing/README.md)** - 测试策略和报告
- **[📊 项目总结](./docs/summaries/README.md)** - 项目状态和总结
