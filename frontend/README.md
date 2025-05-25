# 企业后台管理系统 - 前端

基于 React 19 + TypeScript 的现代化企业后台管理系统前端应用。

## 🚀 技术栈

- **前端框架**: React 19 + TypeScript 5.8+
- **构建工具**: Vite 6
- **UI 组件库**: Ant Design 5
- **状态管理**: Zustand
- **数据获取**: TanStack Query (React Query)
- **路由管理**: TanStack Router (文件路由)
- **HTTP 客户端**: Axios
- **样式方案**: CSS-in-JS + Ant Design 主题
- **代码规范**: ESLint + TypeScript

## 📦 项目结构

```
frontend/
├── src/
│   ├── components/          # 通用组件
│   │   ├── UserForm.tsx    # 用户表单组件
│   │   ├── UserDetail.tsx  # 用户详情组件
│   │   ├── ProtectedRoute.tsx # 路由保护组件
│   │   └── ...
│   ├── pages/              # 页面组件
│   │   ├── Dashboard.tsx   # 仪表盘页面
│   │   └── UserManagement.tsx # 用户管理页面
│   ├── layouts/            # 布局组件
│   │   └── MainLayout.tsx  # 主布局
│   ├── routes/             # 路由配置 (文件路由)
│   │   ├── __root.tsx      # 根路由
│   │   ├── index.tsx       # 首页路由
│   │   ├── dashboard.tsx   # 仪表盘路由
│   │   └── users.tsx       # 用户管理路由
│   ├── stores/             # 状态管理
│   │   ├── appStore.ts     # 应用全局状态
│   │   └── userStore.ts    # 用户状态
│   ├── services/           # API 服务
│   │   ├── userService.ts  # 用户 API
│   │   └── authService.ts  # 认证 API
│   ├── hooks/              # 自定义 Hooks
│   │   └── useUserQuery.ts # 用户查询 Hooks
│   ├── types/              # 类型定义
│   │   ├── user.ts         # 用户类型
│   │   └── common.ts       # 通用类型
│   └── utils/              # 工具函数
├── public/                 # 静态资源
├── index.html             # HTML 模板
├── package.json           # 依赖配置
├── vite.config.ts         # Vite 配置
├── tsconfig.json          # TypeScript 配置
└── eslint.config.js       # ESLint 配置
```

## 🛠️ 开发指南

### 环境要求
- Node.js >= 18
- npm >= 9

### 安装依赖
```bash
cd frontend
npm install
```

### 启动开发服务器
```bash
npm run dev
```
访问: http://localhost:5173

### 构建生产版本
```bash
npm run build
```

### 代码检查
```bash
npm run lint
```

### 预览构建结果
```bash
npm run preview
```

## ✨ 功能特性

### 🎯 核心功能
- **身份验证**: 用户登录、注册、JWT Token 管理
- **RBAC权限管理**: 完整的基于角色的访问控制系统
- **个人资料**: 头像上传、信息编辑、密码修改
- **系统设置**: 界面、通知、隐私、安全设置
- **用户管理**: 完整的用户 CRUD 操作和角色分配
- **权限控制**: 基于角色的权限管理和路由保护

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

## 🔄 数据流

```
用户操作 → 组件事件 → Hooks → API 服务 → 状态更新 → UI 重新渲染
```

### 状态管理流程
1. **UI 交互**: 用户在界面上进行操作
2. **事件处理**: 组件处理用户事件
3. **API 调用**: 通过 TanStack Query 调用后端 API
4. **状态更新**: 更新 Zustand 状态和查询缓存
5. **UI 更新**: React 重新渲染相关组件

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

## 🔗 相关链接

- [后端 API 文档](../backend/README.md)
- [项目总体文档](../README.md)
- [部署指南](../docs/deployment.md)

## �� 许可证

MIT License 
