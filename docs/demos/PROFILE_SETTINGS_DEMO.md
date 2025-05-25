# 🔧 个人资料和系统设置功能演示

## 功能概述

系统新增了完整的个人资料管理和系统设置功能，为用户提供了个性化的使用体验。

### 🎯 新增功能

#### 📋 个人资料管理 (`/profile`)
- **头像上传** - 支持JPG/PNG格式，最大2MB
- **基本信息编辑** - 姓名、邮箱、手机、部门、职位等
- **扩展信息** - 生日、工作地点、个人简介
- **密码修改** - 安全的密码更改功能
- **实时预览** - 即时显示用户信息变更

#### ⚙️ 系统设置 (`/settings`)
- **界面设置** - 主题、语言、字体大小、侧边栏
- **通知设置** - 邮件、浏览器、手机推送、系统通知
- **隐私设置** - 在线状态、数据收集、使用数据分享
- **安全设置** - 双因素认证、会话超时、密码过期
- **快捷操作** - 清除缓存、重置设置

## 🚀 快速体验

### 1. 访问个人资料
1. 登录系统后，点击右上角用户头像
2. 选择"个人资料"菜单项
3. 或直接访问：http://localhost:5173/profile

### 2. 访问系统设置
1. 点击右上角用户头像
2. 选择"系统设置"菜单项（需要管理员或经理权限）
3. 或直接访问：http://localhost:5173/settings

### 3. 演示账户权限
- **admin** - 可访问所有功能
- **user1** - 只能访问个人资料，无法访问系统设置

## 📱 个人资料功能详解

### 头像管理
- **上传功能**：点击头像右下角的相机图标
- **格式支持**：JPG、PNG
- **大小限制**：最大2MB
- **自动生成**：使用Dicebear API生成默认头像

### 基本信息编辑
```typescript
interface ProfileFormData {
  realName: string;        // 真实姓名 *必填
  email: string;          // 邮箱地址 *必填
  phone?: string;         // 手机号码
  department: string;     // 所属部门 *必填
  position: string;       // 职位 *必填
  bio?: string;          // 个人简介
  birthday?: string;     // 生日
  location?: string;     // 工作地点
}
```

### 密码修改
- **安全验证**：需要输入当前密码
- **强度要求**：至少6位，包含字母和数字
- **确认机制**：两次输入新密码确认
- **即时反馈**：密码修改成功后自动清空表单

### 表单验证
- **实时验证**：输入时即时检查格式
- **错误提示**：清晰的错误信息显示
- **必填标识**：明确标注必填字段
- **格式检查**：邮箱、手机号格式验证

## ⚙️ 系统设置功能详解

### 通用设置
```typescript
interface GeneralSettings {
  theme: 'light' | 'dark' | 'auto';    // 主题模式
  language: 'zh-CN' | 'en-US';        // 语言设置
  fontSize: number;                    // 字体大小 (12-18)
  sidebarCollapsed: boolean;           // 侧边栏状态
  autoSave: boolean;                   // 自动保存
}
```

### 通知设置
```typescript
interface NotificationSettings {
  email: boolean;      // 邮件通知
  browser: boolean;    // 浏览器通知
  mobile: boolean;     // 手机推送
  system: boolean;     // 系统通知
}
```

### 隐私设置
```typescript
interface PrivacySettings {
  showOnlineStatus: boolean;      // 显示在线状态
  allowDataCollection: boolean;   // 允许数据收集
  shareUsageData: boolean;        // 分享使用数据
}
```

### 安全设置
```typescript
interface SecuritySettings {
  twoFactorAuth: boolean;    // 双因素认证
  sessionTimeout: number;    // 会话超时时间（分钟）
  passwordExpiry: number;    // 密码过期时间（天）
  loginNotification: boolean; // 登录通知
}
```

## 🛡️ 权限控制

### 个人资料权限
- **访问权限**：`profile:update`
- **适用角色**：所有已认证用户
- **功能限制**：用户只能修改自己的资料

### 系统设置权限
- **访问权限**：`admin` 或 `manager` 角色
- **功能限制**：普通用户无法访问系统设置
- **安全考虑**：系统级设置需要管理权限

## 🎨 UI/UX 特色

### 个人资料页面
- **左右布局**：左侧用户信息卡片，右侧编辑表单
- **标签页设计**：基本信息和密码修改分离
- **头像交互**：悬停显示上传按钮
- **状态显示**：用户角色和状态可视化

### 系统设置页面
- **分类管理**：通用、通知、隐私、安全四大类
- **开关控制**：直观的Switch组件
- **滑块调节**：字体大小可视化调节
- **安全提示**：重要设置带有警告信息

### 响应式设计
- **移动端适配**：小屏幕下自动调整布局
- **栅格系统**：使用Ant Design的24栅格
- **断点设置**：xs、lg断点优化显示

## 🔧 技术实现

### 状态管理
```typescript
// 个人资料状态更新
const { user, setUser } = useAuthStore();

// 系统设置状态
const { collapsed, toggleCollapsed } = useAppStore();
```

### 表单处理
```typescript
// 表单验证和提交
const [form] = Form.useForm();
const handleSubmit = async (values) => {
  // 处理表单数据
};
```

### 文件上传
```typescript
// 头像上传处理
const handleAvatarChange = (info) => {
  if (info.file.status === 'done') {
    // 更新头像URL
  }
};
```

### API集成
```typescript
// 密码修改API调用
const changePasswordMutation = useChangePassword();
await changePasswordMutation.mutateAsync(values);
```

## 📊 功能特性

### 数据持久化
- **本地存储**：设置保存到localStorage
- **状态同步**：实时更新应用状态
- **缓存管理**：智能缓存用户数据

### 安全特性
- **权限验证**：路由级别权限检查
- **数据验证**：前端表单验证
- **安全提示**：敏感操作确认对话框

### 用户体验
- **即时反馈**：操作成功/失败提示
- **加载状态**：按钮loading状态
- **错误处理**：友好的错误信息

## 🔄 操作流程

### 个人资料更新流程
1. 用户访问个人资料页面
2. 修改需要更新的信息
3. 点击"保存更改"按钮
4. 系统验证数据格式
5. 更新用户状态
6. 显示成功提示

### 密码修改流程
1. 切换到"修改密码"标签
2. 输入当前密码
3. 输入新密码和确认密码
4. 系统验证密码强度
5. 调用密码修改API
6. 清空表单并提示成功

### 系统设置保存流程
1. 修改各项设置选项
2. 点击"保存设置"按钮
3. 系统收集所有设置数据
4. 更新应用状态
5. 保存到本地存储
6. 显示保存成功提示

## 🚀 扩展功能

### 未来可扩展的功能
- **主题定制**：自定义颜色主题
- **快捷键设置**：个性化快捷键配置
- **数据导出**：个人数据导出功能
- **活动日志**：用户操作记录
- **多语言支持**：更多语言选项

### 集成建议
- **第三方登录**：社交账号绑定
- **云端同步**：设置云端备份
- **移动应用**：移动端设置同步
- **API开放**：设置API接口

## 📝 开发说明

### 添加新的设置项
```typescript
// 在SystemSettings接口中添加新字段
interface SystemSettings {
  // 现有字段...
  newSetting: boolean;
}

// 在表单中添加对应的Form.Item
<Form.Item name="newSetting" label="新设置">
  <Switch />
</Form.Item>
```

### 自定义权限检查
```typescript
// 在路由中添加权限要求
<ProtectedRoute requiredPermissions={['custom:permission']}>
  <YourComponent />
</ProtectedRoute>
```

### 扩展个人资料字段
```typescript
// 更新AuthUser类型
interface AuthUser {
  // 现有字段...
  newField?: string;
}
```

## 🎉 总结

个人资料和系统设置功能为企业管理系统增加了重要的用户个性化能力：

✅ **完整的个人资料管理** - 头像、信息、密码  
✅ **全面的系统设置** - 界面、通知、隐私、安全  
✅ **严格的权限控制** - 基于角色的访问限制  
✅ **优秀的用户体验** - 现代化界面和交互  
✅ **安全的数据处理** - 表单验证和错误处理  

这些功能大大提升了系统的可用性和用户满意度，为企业用户提供了个性化的工作环境。

---

**🔗 相关文档:**
- [AUTH_DEMO.md](./AUTH_DEMO.md) - 身份验证功能演示
- [README.md](./README.md) - 项目总体介绍 
