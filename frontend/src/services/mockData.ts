import type { User } from '../types/user';
import type { Role } from '../types/auth';

// 模拟角色数据
const mockRoles: Role[] = [
  { id: 1, name: 'admin', display_name: '管理员', level: 1, is_system: true, is_active: true },
  { id: 2, name: 'manager', display_name: '经理', level: 2, is_system: false, is_active: true },
  { id: 3, name: 'user', display_name: '普通用户', level: 3, is_system: false, is_active: true },
];

// 模拟用户数据
export const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@company.com',
    first_name: '管理员',
    last_name: '',
    full_name: '系统管理员',
    phone: '13800138000',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    department: '技术部',
    position: '系统管理员',
    is_active: true,
    is_verified: true,
    is_superuser: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_login_at: '2024-01-15T10:30:00Z',
    roles: [mockRoles[0]],
  },
  {
    id: 2,
    username: 'manager1',
    email: 'manager1@company.com',
    first_name: '张',
    last_name: '经理',
    full_name: '张经理',
    phone: '13800138001',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager1',
    department: '销售部',
    position: '销售经理',
    is_active: true,
    is_verified: true,
    is_superuser: false,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    last_login_at: '2024-01-15T09:15:00Z',
    roles: [mockRoles[1]],
  },
  {
    id: 3,
    username: 'user1',
    email: 'user1@company.com',
    first_name: '李',
    last_name: '小明',
    full_name: '李小明',
    phone: '13800138002',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    department: '技术部',
    position: '前端开发工程师',
    is_active: true,
    is_verified: true,
    is_superuser: false,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    last_login_at: '2024-01-15T08:45:00Z',
    roles: [mockRoles[2]],
  },
  {
    id: 4,
    username: 'user2',
    email: 'user2@company.com',
    first_name: '王',
    last_name: '小红',
    full_name: '王小红',
    phone: '13800138003',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    department: '人事部',
    position: 'HR专员',
    is_active: false,
    is_verified: true,
    is_superuser: false,
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
    last_login_at: '2024-01-10T16:20:00Z',
    roles: [mockRoles[2]],
  },
  {
    id: 5,
    username: 'user3',
    email: 'user3@company.com',
    first_name: '赵',
    last_name: '小刚',
    full_name: '赵小刚',
    phone: '13800138004',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
    department: '财务部',
    position: '会计',
    is_active: true,
    is_verified: false,
    is_superuser: false,
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z',
    roles: [mockRoles[2]],
  },
  {
    id: 6,
    username: 'manager2',
    email: 'manager2@company.com',
    first_name: '刘',
    last_name: '总监',
    full_name: '刘总监',
    phone: '13800138005',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager2',
    department: '技术部',
    position: '技术总监',
    is_active: true,
    is_verified: true,
    is_superuser: false,
    created_at: '2024-01-06T00:00:00Z',
    updated_at: '2024-01-06T00:00:00Z',
    last_login_at: '2024-01-15T07:30:00Z',
    roles: [mockRoles[1]],
  },
  {
    id: 7,
    username: 'user4',
    email: 'user4@company.com',
    first_name: '陈',
    last_name: '小美',
    full_name: '陈小美',
    phone: '13800138006',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user4',
    department: '市场部',
    position: '市场专员',
    is_active: true,
    is_verified: true,
    is_superuser: false,
    created_at: '2024-01-07T00:00:00Z',
    updated_at: '2024-01-07T00:00:00Z',
    last_login_at: '2024-01-14T18:45:00Z',
    roles: [mockRoles[2]],
  },
  {
    id: 8,
    username: 'user5',
    email: 'user5@company.com',
    first_name: '周',
    last_name: '小强',
    full_name: '周小强',
    phone: '13800138007',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user5',
    department: '技术部',
    position: '后端开发工程师',
    is_active: true,
    is_verified: true,
    is_superuser: false,
    created_at: '2024-01-08T00:00:00Z',
    updated_at: '2024-01-08T00:00:00Z',
    last_login_at: '2024-01-15T09:00:00Z',
    roles: [mockRoles[2]],
  },
];

// 部门列表
export const departments = [
  '技术部',
  '产品部',
  '设计部',
  '运营部',
  '销售部',
  '人事部',
  '财务部',
  '市场部',
];

// 权限列表
export const permissions = [
  { key: '*', label: '所有权限' },
  { key: 'user:read', label: '用户查看' },
  { key: 'user:create', label: '用户创建' },
  { key: 'user:update', label: '用户编辑' },
  { key: 'user:delete', label: '用户删除' },
  { key: 'product:*', label: '产品管理' },
  { key: 'sales:*', label: '销售管理' },
  { key: 'hr:read', label: '人事查看' },
  { key: 'profile:update', label: '个人资料编辑' },
]; 
