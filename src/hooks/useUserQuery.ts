import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { UserService } from '../services/userService';
import type { 
  UserListParams, 
  CreateUserRequest, 
  UpdateUserRequest,
  UpdateProfileRequest,
  AssignUserRolesRequest,
  RemoveUserRolesRequest
} from '../types/user';

// 查询键工厂
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
  roles: (id: number) => [...userKeys.detail(id), 'roles'] as const,
  settings: (id: number) => [...userKeys.detail(id), 'settings'] as const,
};

// 获取用户列表
export const useUserList = (params: UserListParams) => {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => UserService.getUsers(params),
    staleTime: 5 * 60 * 1000, // 5分钟
    gcTime: 10 * 60 * 1000, // 10分钟
    placeholderData: (previousData) => previousData, // 保持上一次数据，避免加载闪烁
  });
};

// 获取用户详情
export const useUserDetail = (id: number) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => UserService.getUserById(id),
    enabled: !!id, // 只有当id存在时才执行查询
    staleTime: 5 * 60 * 1000,
  });
};

// 获取用户角色
export const useUserRoles = (userId: number) => {
  return useQuery({
    queryKey: userKeys.roles(userId),
    queryFn: () => UserService.getUserRoles(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

// 获取用户设置
export const useUserSettings = (userId: number) => {
  return useQuery({
    queryKey: userKeys.settings(userId),
    queryFn: () => UserService.getUserSettings(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

// 创建用户
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: CreateUserRequest) => UserService.createUser(userData),
    onSuccess: (newUser) => {
      // 使查询缓存失效
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      
      // 可选：直接更新缓存
      queryClient.setQueryData(userKeys.detail(newUser.id), newUser);
      
      message.success('用户创建成功');
    },
    onError: (error: any) => {
      message.error(error.message || '创建用户失败');
    },
  });
};

// 更新用户
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, userData }: { id: number; userData: UpdateUserRequest }) => 
      UserService.updateUser(id, userData),
    onSuccess: (updatedUser, { id }) => {
      // 更新详情缓存
      queryClient.setQueryData(userKeys.detail(id), updatedUser);
      
      // 使列表缓存失效
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      
      message.success('用户更新成功');
    },
    onError: (error: any) => {
      message.error(error.message || '更新用户失败');
    },
  });
};

// 删除用户
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => UserService.deleteUser(id),
    onSuccess: (_, id) => {
      // 移除详情缓存
      queryClient.removeQueries({ queryKey: userKeys.detail(id) });
      
      // 使列表缓存失效
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      
      message.success('用户删除成功');
    },
    onError: (error: any) => {
      message.error(error.message || '删除用户失败');
    },
  });
};

// 批量删除用户
export const useBatchDeleteUsers = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userIds: number[]) => UserService.batchDeleteUsers(userIds),
    onSuccess: (result, userIds) => {
      // 移除详情缓存
      userIds.forEach(id => {
        queryClient.removeQueries({ queryKey: userKeys.detail(id) });
      });
      
      // 使列表缓存失效
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      
      message.success(`成功删除 ${result.deleted_count} 个用户`);
      
      if (result.failed_ids.length > 0) {
        message.warning(`${result.failed_ids.length} 个用户删除失败`);
      }
    },
    onError: (error: any) => {
      message.error(error.message || '批量删除失败');
    },
  });
};

// 重置密码
export const useResetPassword = () => {
  return useMutation({
    mutationFn: (id: number) => UserService.resetPassword(id),
    onSuccess: (result) => {
      message.success(`密码重置成功，临时密码：${result.temporary_password}`);
    },
    onError: (error: any) => {
      message.error(error.message || '密码重置失败');
    },
  });
};

// 分配用户角色
export const useAssignUserRoles = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: AssignUserRolesRequest }) => 
      UserService.assignUserRoles(userId, data),
    onSuccess: (result, { userId }) => {
      // 使用户详情和角色缓存失效
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.roles(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      
      message.success(`成功分配 ${result.assigned_count} 个角色`);
    },
    onError: (error: any) => {
      message.error(error.message || '分配角色失败');
    },
  });
};

// 移除用户角色
export const useRemoveUserRoles = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: RemoveUserRolesRequest }) => 
      UserService.removeUserRoles(userId, data),
    onSuccess: (result, { userId }) => {
      // 使用户详情和角色缓存失效
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.roles(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      
      message.success(`成功移除 ${result.removed_count} 个角色`);
    },
    onError: (error: any) => {
      message.error(error.message || '移除角色失败');
    },
  });
};

// 更新个人资料
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: UpdateProfileRequest }) => 
      UserService.updateProfile(userId, data),
    onSuccess: (updatedUser, { userId }) => {
      // 更新用户详情缓存
      queryClient.setQueryData(userKeys.detail(userId), updatedUser);
      
      // 使列表缓存失效
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      
      message.success('个人资料更新成功');
    },
    onError: (error: any) => {
      message.error(error.message || '更新个人资料失败');
    },
  });
};

// 激活用户
export const useActivateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => UserService.activateUser(id),
    onSuccess: (_, id) => {
      // 使相关缓存失效
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      
      message.success('用户激活成功');
    },
    onError: (error: any) => {
      message.error(error.message || '激活用户失败');
    },
  });
};

// 禁用用户
export const useDeactivateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => UserService.deactivateUser(id),
    onSuccess: (_, id) => {
      // 使相关缓存失效
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      
      message.success('用户禁用成功');
    },
    onError: (error: any) => {
      message.error(error.message || '禁用用户失败');
    },
  });
}; 
