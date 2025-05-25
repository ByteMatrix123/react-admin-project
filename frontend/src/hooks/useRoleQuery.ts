import { useQuery } from '@tanstack/react-query';
import apiClient from '../utils/api';
import type { Role } from '../types/auth';

// Query Keys
export const roleQueryKeys = {
  all: ['roles'] as const,
  list: () => [...roleQueryKeys.all, 'list'] as const,
  detail: (id: number) => [...roleQueryKeys.all, 'detail', id] as const,
};

// 获取角色列表（用于用户角色分配）
export const useRoles = () => {
  return useQuery({
    queryKey: roleQueryKeys.list(),
    queryFn: async (): Promise<Role[]> => {
      const response: any[] = await apiClient.get('/roles/');
      return response.map((role: any) => ({
        id: role.id,
        name: role.name,
        display_name: role.display_name,
        description: role.description,
        level: 50, // 默认级别，可以根据需要调整
        is_system: role.is_system,
        is_active: role.is_active,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5分钟
    gcTime: 10 * 60 * 1000, // 10分钟
  });
};

// 获取角色详情
export const useRole = (roleId: number) => {
  return useQuery({
    queryKey: roleQueryKeys.detail(roleId),
    queryFn: async (): Promise<Role> => {
      const response: any = await apiClient.get(`/roles/${roleId}`);
      return {
        id: response.id,
        name: response.name,
        display_name: response.display_name,
        description: response.description,
        level: 50, // 默认级别
        is_system: response.is_system,
        is_active: response.is_active,
      };
    },
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000,
  });
}; 
