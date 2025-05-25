import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { userService } from '../services/userService';
import { useUserStore } from '../stores/userStore';
import type { UserListParams, CreateUserRequest, UpdateUserRequest } from '../types/user';

// Query Keys
export const userQueryKeys = {
  all: ['users'] as const,
  lists: () => [...userQueryKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...userQueryKeys.lists(), params] as const,
  details: () => [...userQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...userQueryKeys.details(), id] as const,
};

// 获取用户列表
export const useUserList = (params: UserListParams) => {
  const { setUsers, setLoading, setError } = useUserStore();

  return useQuery({
    queryKey: userQueryKeys.list(params),
    queryFn: async () => {
      setLoading(true);
      try {
        const response = await userService.getUserList(params);
        if (response.success) {
          setUsers(response.data.data, response.data.total);
          setError(null);
          return response.data;
        } else {
          setError(response.message);
          throw new Error(response.message);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : '获取用户列表失败');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 5 * 60 * 1000, // 5分钟
    gcTime: 10 * 60 * 1000, // 10分钟
  });
};

// 获取用户详情
export const useUserDetail = (id: string) => {
  return useQuery({
    queryKey: userQueryKeys.detail(id),
    queryFn: async () => {
      const response = await userService.getUserById(id);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// 创建用户
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { addUser } = useUserStore();

  return useMutation({
    mutationFn: async (userData: CreateUserRequest) => {
      const response = await userService.createUser(userData);
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    },
    onSuccess: (newUser) => {
      // 更新本地状态
      addUser(newUser);
      
      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      
      message.success('用户创建成功');
    },
    onError: (error: Error) => {
      message.error(error.message || '创建用户失败');
    },
  });
};

// 更新用户
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useUserStore();

  return useMutation({
    mutationFn: async (userData: UpdateUserRequest) => {
      const response = await userService.updateUser(userData);
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    },
    onSuccess: (updatedUser) => {
      // 更新本地状态
      updateUser(updatedUser);
      
      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(updatedUser.id) });
      
      message.success('用户更新成功');
    },
    onError: (error: Error) => {
      message.error(error.message || '更新用户失败');
    },
  });
};

// 删除用户
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { removeUser } = useUserStore();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await userService.deleteUser(id);
      if (response.success) {
        return id;
      } else {
        throw new Error(response.message);
      }
    },
    onSuccess: (deletedId) => {
      // 更新本地状态
      removeUser(deletedId);
      
      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      queryClient.removeQueries({ queryKey: userQueryKeys.detail(deletedId) });
      
      message.success('用户删除成功');
    },
    onError: (error: Error) => {
      message.error(error.message || '删除用户失败');
    },
  });
};

// 批量删除用户
export const useBatchDeleteUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await userService.batchDeleteUsers(ids);
      if (response.success) {
        return ids;
      } else {
        throw new Error(response.message);
      }
    },
    onSuccess: (deletedIds) => {
      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      
      // 移除详情查询
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: userQueryKeys.detail(id) });
      });
      
      message.success(`成功删除 ${deletedIds.length} 个用户`);
    },
    onError: (error: Error) => {
      message.error(error.message || '批量删除失败');
    },
  });
};

// 重置密码
export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await userService.resetPassword(id);
      if (response.success) {
        return id;
      } else {
        throw new Error(response.message);
      }
    },
    onSuccess: () => {
      message.success('密码重置成功');
    },
    onError: (error: Error) => {
      message.error(error.message || '密码重置失败');
    },
  });
}; 
