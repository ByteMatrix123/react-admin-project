import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import type { 
  LoginRequest, 
  RegisterRequest, 
  PasswordResetRequest,
  PasswordChangeRequest 
} from '../types/auth';

// Query Keys
export const authQueryKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authQueryKeys.all, 'currentUser'] as const,
};

// 登录
export const useLogin = () => {
  const { setAuth, setLoading, setError } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      setLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.refreshToken);
      setLoading(false);
      message.success('登录成功');
    },
    onError: (error: Error) => {
      setError(error.message);
      setLoading(false);
      message.error(error.message || '登录失败');
    },
  });
};

// 注册
export const useRegister = () => {
  const { setLoading, setError } = useAuthStore();

  return useMutation({
    mutationFn: async (userData: RegisterRequest) => {
      setLoading(true);
      setError(null);
      
      const response = await authService.register(userData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    },
    onSuccess: () => {
      // 注册成功后不自动登录，因为需要审核
      setLoading(false);
      message.success('注册成功，请等待管理员审核');
    },
    onError: (error: Error) => {
      setError(error.message);
      setLoading(false);
      message.error(error.message || '注册失败');
    },
  });
};

// 登出
export const useLogout = () => {
  const queryClient = useQueryClient();
  const { clearAuth, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      setLoading(true);
      const response = await authService.logout();
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message);
      }
    },
    onSuccess: () => {
      clearAuth();
      setLoading(false);
      
      // 清除所有查询缓存
      queryClient.clear();
      
      message.success('已安全退出');
    },
    onError: (error: Error) => {
      setLoading(false);
      message.error(error.message || '退出失败');
    },
  });
};

// 获取当前用户信息
export const useCurrentUser = () => {
  const { token, setUser, setError } = useAuthStore();

  const query = useQuery({
    queryKey: authQueryKeys.currentUser(),
    queryFn: async () => {
      if (!token) {
        throw new Error('未登录');
      }
      
      const response = await authService.getCurrentUser(token);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  // 处理成功和错误状态
  React.useEffect(() => {
    if (query.data) {
      setUser(query.data);
      setError(null);
    }
    if (query.error) {
      setError(query.error.message);
    }
  }, [query.data, query.error, setUser, setError]);

  return query;
};

// 刷新token
export const useRefreshToken = () => {
  const { refreshToken, updateToken, clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      if (!refreshToken) {
        throw new Error('Refresh token不存在');
      }
      
      const response = await authService.refreshToken(refreshToken);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    },
    onSuccess: (data) => {
      updateToken(data.token, data.refreshToken);
    },
    onError: () => {
      // Token刷新失败，清除认证状态
      clearAuth();
      message.error('登录已过期，请重新登录');
    },
  });
};

// 忘记密码
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (data: PasswordResetRequest) => {
      const response = await authService.forgotPassword(data);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message);
      }
    },
    onSuccess: () => {
      message.success('密码重置邮件已发送，请查收邮箱');
    },
    onError: (error: Error) => {
      message.error(error.message || '发送失败');
    },
  });
};

// 修改密码
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: PasswordChangeRequest) => {
      const response = await authService.changePassword(data);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message);
      }
    },
    onSuccess: () => {
      message.success('密码修改成功');
    },
    onError: (error: Error) => {
      message.error(error.message || '密码修改失败');
    },
  });
}; 
