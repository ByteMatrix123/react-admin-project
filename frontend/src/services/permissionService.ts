import type { 
  Permission, 
  Role, 
  PermissionStats,
  PermissionAuditLog,
  RolePermissionRequest,
  PermissionCheckResult
} from '../types/permission';
import type { ApiResponse } from '../types/common';

// 模拟API延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 系统权限定义
export const systemPermissions: Permission[] = [
  // 用户管理权限
  {
    id: 'perm_user_create',
    name: '创建用户',
    code: 'user:create',
    resource: 'user',
    action: 'create',
    description: '允许创建新用户',
    category: '用户管理',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'perm_user_read',
    name: '查看用户',
    code: 'user:read',
    resource: 'user',
    action: 'read',
    description: '允许查看用户信息',
    category: '用户管理',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'perm_user_update',
    name: '编辑用户',
    code: 'user:update',
    resource: 'user',
    action: 'update',
    description: '允许编辑用户信息',
    category: '用户管理',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'perm_user_delete',
    name: '删除用户',
    code: 'user:delete',
    resource: 'user',
    action: 'delete',
    description: '允许删除用户',
    category: '用户管理',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'perm_user_manage',
    name: '用户管理',
    code: 'user:manage',
    resource: 'user',
    action: 'manage',
    description: '完整的用户管理权限',
    category: '用户管理',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  
  // 角色权限管理
  {
    id: 'perm_role_create',
    name: '创建角色',
    code: 'role:create',
    resource: 'role',
    action: 'create',
    description: '允许创建新角色',
    category: '角色管理',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'perm_role_read',
    name: '查看角色',
    code: 'role:read',
    resource: 'role',
    action: 'read',
    description: '允许查看角色信息',
    category: '角色管理',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'perm_role_update',
    name: '编辑角色',
    code: 'role:update',
    resource: 'role',
    action: 'update',
    description: '允许编辑角色信息',
    category: '角色管理',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'perm_role_delete',
    name: '删除角色',
    code: 'role:delete',
    resource: 'role',
    action: 'delete',
    description: '允许删除角色',
    category: '角色管理',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  
  // 权限管理
  {
    id: 'perm_permission_manage',
    name: '权限管理',
    code: 'permission:manage',
    resource: 'permission',
    action: 'manage',
    description: '完整的权限管理功能',
    category: '权限管理',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  
  // 个人资料
  {
    id: 'perm_profile_update',
    name: '更新个人资料',
    code: 'profile:update',
    resource: 'profile',
    action: 'update',
    description: '允许更新个人资料',
    category: '个人中心',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  
  // 系统设置
  {
    id: 'perm_settings_manage',
    name: '系统设置',
    code: 'settings:manage',
    resource: 'settings',
    action: 'manage',
    description: '允许管理系统设置',
    category: '系统管理',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  
  // 仪表盘
  {
    id: 'perm_dashboard_read',
    name: '查看仪表盘',
    code: 'dashboard:read',
    resource: 'dashboard',
    action: 'read',
    description: '允许查看仪表盘',
    category: '仪表盘',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  
  // 系统管理
  {
    id: 'perm_system_manage',
    name: '系统管理',
    code: 'system:manage',
    resource: 'system',
    action: 'manage',
    description: '完整的系统管理权限',
    category: '系统管理',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// 系统角色定义
export const systemRoles: Role[] = [
  {
    id: 'role_super_admin',
    name: '超级管理员',
    code: 'super_admin',
    description: '拥有系统所有权限的超级管理员',
    level: 100,
    permissions: systemPermissions,
    userCount: 1,
    isSystem: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role_admin',
    name: '管理员',
    code: 'admin',
    description: '系统管理员，拥有大部分管理权限',
    level: 80,
    permissions: systemPermissions.filter(p => 
      !['system:manage'].includes(p.code)
    ),
    userCount: 2,
    isSystem: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role_manager',
    name: '经理',
    code: 'manager',
    description: '部门经理，拥有用户管理和查看权限',
    level: 60,
    permissions: systemPermissions.filter(p => 
      ['user:read', 'user:update', 'dashboard:read', 'profile:update', 'settings:manage'].includes(p.code)
    ),
    userCount: 5,
    isSystem: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role_user',
    name: '普通用户',
    code: 'user',
    description: '普通用户，拥有基本的查看和个人资料权限',
    level: 20,
    permissions: systemPermissions.filter(p => 
      ['dashboard:read', 'profile:update'].includes(p.code)
    ),
    userCount: 50,
    isSystem: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role_guest',
    name: '访客',
    code: 'guest',
    description: '访客用户，只有基本查看权限',
    level: 10,
    permissions: systemPermissions.filter(p => 
      ['dashboard:read'].includes(p.code)
    ),
    userCount: 10,
    isSystem: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// 模拟审计日志
const auditLogs: PermissionAuditLog[] = [
  {
    id: 'audit_1',
    action: 'assign',
    targetType: 'user',
    targetId: 'user_1',
    targetName: '张三',
    operatorId: 'admin',
    operatorName: '管理员',
    details: '分配角色：经理',
    timestamp: '2024-01-15T10:30:00Z',
  },
  {
    id: 'audit_2',
    action: 'create',
    targetType: 'role',
    targetId: 'role_custom_1',
    targetName: '自定义角色',
    operatorId: 'admin',
    operatorName: '管理员',
    details: '创建新角色：自定义角色',
    timestamp: '2024-01-14T14:20:00Z',
  },
];

export const permissionService = {
  // 获取所有权限
  async getPermissions(): Promise<ApiResponse<Permission[]>> {
    await delay(300);
    return {
      code: 200,
      message: '获取权限列表成功',
      success: true,
      data: systemPermissions,
    };
  },

  // 获取所有角色
  async getRoles(): Promise<ApiResponse<Role[]>> {
    await delay(300);
    return {
      code: 200,
      message: '获取角色列表成功',
      success: true,
      data: systemRoles,
    };
  },

  // 获取角色详情
  async getRoleById(roleId: string): Promise<ApiResponse<Role | null>> {
    await delay(200);
    const role = systemRoles.find(r => r.id === roleId);
    return {
      code: role ? 200 : 404,
      message: role ? '获取角色详情成功' : '角色不存在',
      success: !!role,
      data: role || null,
    };
  },

  // 创建角色
  async createRole(roleData: Partial<Role>): Promise<ApiResponse<Role | null>> {
    await delay(500);
    
    // 检查角色代码是否已存在
    const existingRole = systemRoles.find(r => r.code === roleData.code);
    if (existingRole) {
      return {
        code: 400,
        message: '角色代码已存在',
        success: false,
        data: null,
      };
    }

    const newRole: Role = {
      id: `role_${Date.now()}`,
      name: roleData.name || '',
      code: roleData.code || '',
      description: roleData.description || '',
      level: roleData.level || 30,
      permissions: roleData.permissions || [],
      userCount: 0,
      isSystem: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    systemRoles.push(newRole);

    return {
      code: 200,
      message: '角色创建成功',
      success: true,
      data: newRole,
    };
  },

  // 更新角色
  async updateRole(roleId: string, roleData: Partial<Role>): Promise<ApiResponse<Role | null>> {
    await delay(500);
    
    const roleIndex = systemRoles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
      return {
        code: 404,
        message: '角色不存在',
        success: false,
        data: null,
      };
    }

    const role = systemRoles[roleIndex];
    
    // 系统角色不允许修改某些字段
    if (role.isSystem && (roleData.code || roleData.isSystem !== undefined)) {
      return {
        code: 400,
        message: '系统角色不允许修改代码或系统标识',
        success: false,
        data: null,
      };
    }

    const updatedRole = {
      ...role,
      ...roleData,
      id: roleId, // 确保ID不被修改
      updatedAt: new Date().toISOString(),
    };

    systemRoles[roleIndex] = updatedRole;

    return {
      code: 200,
      message: '角色更新成功',
      success: true,
      data: updatedRole,
    };
  },

  // 删除角色
  async deleteRole(roleId: string): Promise<ApiResponse<null>> {
    await delay(300);
    
    const roleIndex = systemRoles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
      return {
        code: 404,
        message: '角色不存在',
        success: false,
        data: null,
      };
    }

    const role = systemRoles[roleIndex];
    
    // 系统角色不允许删除
    if (role.isSystem) {
      return {
        code: 400,
        message: '系统角色不允许删除',
        success: false,
        data: null,
      };
    }

    // 检查是否有用户使用该角色
    if (role.userCount > 0) {
      return {
        code: 400,
        message: '该角色下还有用户，无法删除',
        success: false,
        data: null,
      };
    }

    systemRoles.splice(roleIndex, 1);

    return {
      code: 200,
      message: '角色删除成功',
      success: true,
      data: null,
    };
  },

  // 分配角色权限
  async assignRolePermissions(request: RolePermissionRequest): Promise<ApiResponse<null>> {
    await delay(500);
    
    const roleIndex = systemRoles.findIndex(r => r.id === request.roleId);
    if (roleIndex === -1) {
      return {
        code: 404,
        message: '角色不存在',
        success: false,
        data: null,
      };
    }

    const permissions = systemPermissions.filter(p => 
      request.permissionIds.includes(p.id)
    );

    systemRoles[roleIndex].permissions = permissions;
    systemRoles[roleIndex].updatedAt = new Date().toISOString();

    return {
      code: 200,
      message: '权限分配成功',
      success: true,
      data: null,
    };
  },

  // 检查权限
  async checkPermission(_userId: string, _permission: string): Promise<ApiResponse<PermissionCheckResult>> {
    await delay(100);
    
    // 这里应该根据用户ID查询用户的角色和权限
    // 简化实现，假设从当前用户获取
    const hasPermission = true; // 实际应该检查用户权限
    
    return {
      code: 200,
      message: '权限检查完成',
      success: true,
      data: {
        hasPermission,
        reason: hasPermission ? undefined : '权限不足',
      },
    };
  },

  // 获取权限统计
  async getPermissionStats(): Promise<ApiResponse<PermissionStats>> {
    await delay(200);
    
    const stats: PermissionStats = {
      totalPermissions: systemPermissions.length,
      totalRoles: systemRoles.length,
      activeRoles: systemRoles.filter(r => r.isActive).length,
      systemRoles: systemRoles.filter(r => r.isSystem).length,
      customRoles: systemRoles.filter(r => !r.isSystem).length,
      permissionsByCategory: systemPermissions.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return {
      code: 200,
      message: '获取统计信息成功',
      success: true,
      data: stats,
    };
  },

  // 获取审计日志
  async getAuditLogs(page = 1, pageSize = 10): Promise<ApiResponse<{
    list: PermissionAuditLog[];
    total: number;
    page: number;
    pageSize: number;
  }>> {
    await delay(300);
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const list = auditLogs.slice(start, end);

    return {
      code: 200,
      message: '获取审计日志成功',
      success: true,
      data: {
        list,
        total: auditLogs.length,
        page,
        pageSize,
      },
    };
  },

  // 按分类获取权限树
  async getPermissionTree(): Promise<ApiResponse<any[]>> {
    await delay(200);
    
    const categories = [...new Set(systemPermissions.map(p => p.category))];
    const tree = categories.map(category => ({
      key: category,
      title: category,
      children: systemPermissions
        .filter(p => p.category === category)
        .map(p => ({
          key: p.id,
          title: `${p.name} (${p.code})`,
          permission: p,
        })),
    }));

    return {
      code: 200,
      message: '获取权限树成功',
      success: true,
      data: tree,
    };
  },
}; 
