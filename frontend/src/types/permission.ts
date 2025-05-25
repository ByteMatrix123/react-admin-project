// 权限操作类型
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage';

// 资源类型
export type ResourceType = 'user' | 'role' | 'permission' | 'dashboard' | 'profile' | 'settings' | 'system';

// 权限定义
export interface Permission {
  id: string;
  name: string;
  code: string;
  resource: ResourceType;
  action: PermissionAction;
  description: string;
  category: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

// 角色定义
export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  level: number; // 角色级别，数字越大权限越高
  permissions: Permission[];
  userCount: number;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 用户角色关联
export interface UserRole {
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: string;
  expiresAt?: string;
}

// 权限检查结果
export interface PermissionCheckResult {
  hasPermission: boolean;
  reason?: string;
  requiredPermissions?: string[];
  userPermissions?: string[];
}

// 权限树节点
export interface PermissionTreeNode {
  key: string;
  title: string;
  children?: PermissionTreeNode[];
  permission?: Permission;
  disabled?: boolean;
}

// 角色权限分配请求
export interface RolePermissionRequest {
  roleId: string;
  permissionIds: string[];
}

// 用户角色分配请求
export interface UserRoleRequest {
  userId: string;
  roleIds: string[];
}

// 权限统计
export interface PermissionStats {
  totalPermissions: number;
  totalRoles: number;
  activeRoles: number;
  systemRoles: number;
  customRoles: number;
  permissionsByCategory: Record<string, number>;
}

// 权限审计日志
export interface PermissionAuditLog {
  id: string;
  action: 'assign' | 'revoke' | 'create' | 'update' | 'delete';
  targetType: 'user' | 'role' | 'permission';
  targetId: string;
  targetName: string;
  operatorId: string;
  operatorName: string;
  details: string;
  timestamp: string;
}

// 权限配置
export interface PermissionConfig {
  enableAuditLog: boolean;
  enableRoleHierarchy: boolean;
  enablePermissionInheritance: boolean;
  maxRolesPerUser: number;
  defaultRole: string;
  adminRole: string;
} 
