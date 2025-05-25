import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { permissionService } from '../services/permissionService';
import type { Role, RolePermissionRequest } from '../types/permission';

// Query Keys
export const permissionQueryKeys = {
  all: ['permissions'] as const,
  permissions: () => [...permissionQueryKeys.all, 'list'] as const,
  roles: () => [...permissionQueryKeys.all, 'roles'] as const,
  role: (id: string) => [...permissionQueryKeys.all, 'role', id] as const,
  stats: () => [...permissionQueryKeys.all, 'stats'] as const,
  auditLogs: (page: number) => [...permissionQueryKeys.all, 'auditLogs', page] as const,
  permissionTree: () => [...permissionQueryKeys.all, 'tree'] as const,
};

// 获取权限列表
export const usePermissions = () => {
  return useQuery({
    queryKey: permissionQueryKeys.permissions(),
    queryFn: async () => {
      const response = await permissionService.getPermissions();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message);
    },
    staleTime: 5 * 60 * 1000, // 5分钟
  });
};

// 获取角色列表
export const useRoles = () => {
  return useQuery({
    queryKey: permissionQueryKeys.roles(),
    queryFn: async () => {
      const response = await permissionService.getRoles();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message);
    },
    staleTime: 5 * 60 * 1000,
  });
};

// 获取角色详情
export const useRole = (roleId: string) => {
  return useQuery({
    queryKey: permissionQueryKeys.role(roleId),
    queryFn: async () => {
      const response = await permissionService.getRoleById(roleId);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message);
    },
    enabled: !!roleId,
  });
};

// 创建角色
export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleData: Partial<Role>) => {
      const response = await permissionService.createRole(roleData);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionQueryKeys.roles() });
      queryClient.invalidateQueries({ queryKey: permissionQueryKeys.stats() });
      message.success('角色创建成功');
    },
    onError: (error: Error) => {
      message.error(error.message || '角色创建失败');
    },
  });
};

// 更新角色
export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, roleData }: { roleId: string; roleData: Partial<Role> }) => {
      const response = await permissionService.updateRole(roleId, roleData);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: permissionQueryKeys.roles() });
      queryClient.invalidateQueries({ queryKey: permissionQueryKeys.role(variables.roleId) });
      message.success('角色更新成功');
    },
    onError: (error: Error) => {
      message.error(error.message || '角色更新失败');
    },
  });
};

// 删除角色
export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleId: string) => {
      const response = await permissionService.deleteRole(roleId);
      if (response.success) {
        return response;
      }
      throw new Error(response.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionQueryKeys.roles() });
      queryClient.invalidateQueries({ queryKey: permissionQueryKeys.stats() });
      message.success('角色删除成功');
    },
    onError: (error: Error) => {
      message.error(error.message || '角色删除失败');
    },
  });
};

// 分配角色权限
export const useAssignRolePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: RolePermissionRequest) => {
      const response = await permissionService.assignRolePermissions(request);
      if (response.success) {
        return response;
      }
      throw new Error(response.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: permissionQueryKeys.roles() });
      queryClient.invalidateQueries({ queryKey: permissionQueryKeys.role(variables.roleId) });
      message.success('权限分配成功');
    },
    onError: (error: Error) => {
      message.error(error.message || '权限分配失败');
    },
  });
};

// 获取权限统计
export const usePermissionStats = () => {
  return useQuery({
    queryKey: permissionQueryKeys.stats(),
    queryFn: async () => {
      const response = await permissionService.getPermissionStats();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message);
    },
    staleTime: 2 * 60 * 1000, // 2分钟
  });
};

// 获取审计日志
export const useAuditLogs = (page: number = 1, pageSize: number = 10) => {
  return useQuery({
    queryKey: permissionQueryKeys.auditLogs(page),
    queryFn: async () => {
      const response = await permissionService.getAuditLogs(page, pageSize);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message);
    },
    staleTime: 30 * 1000, // 30秒
  });
};

// 获取权限树
export const usePermissionTree = () => {
  return useQuery({
    queryKey: permissionQueryKeys.permissionTree(),
    queryFn: async () => {
      const response = await permissionService.getPermissionTree();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message);
    },
    staleTime: 5 * 60 * 1000,
  });
}; 
