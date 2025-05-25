import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { AuthService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import type { 
  LoginRequest, 
  RegisterRequest, 
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from '../types/auth';

// Query Keys
export const authQueryKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authQueryKeys.all, 'currentUser'] as const,
};

// 登录
export const useLogin = () => {
  const { setAuth, setLoading, setError } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      setLoading(true);
      setError(null);
      
      const response = await AuthService.login(credentials);
      
      setAuth(response.user, response.access_token, response.refresh_token);
      queryClient.setQueryData(authQueryKeys.currentUser(), response.user);
      return response;
    },
    onSuccess: () => {
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
      
      const response = await AuthService.register(userData);
      
      if (response.verification_required) {
        message.success('注册成功，请查收验证邮件');
      } else {
        message.success('注册成功');
      }
      return response;
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
      await AuthService.logout();
      
      clearAuth();
      queryClient.clear();
      message.success('登出成功');
    },
    onError: () => {
      clearAuth();
      queryClient.clear();
      message.warning('登出时发生错误，但已清除本地状态');
      setLoading(false);
    },
  });
};

// 获取当前用户信息
export const useCurrentUser = () => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: authQueryKeys.currentUser(),
    queryFn: AuthService.getCurrentUser,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};

// 刷新token
export const useRefreshToken = () => {
  const { refreshToken, updateToken, clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      if (!refreshToken) {
        throw new Error('Refresh token不存在');
      }
      
      const response = await AuthService.refreshToken(refreshToken);
      return response;
    },
    onSuccess: (data) => {
      updateToken(data.access_token);
    },
    onError: () => {
      clearAuth();
      message.error('登录已过期，请重新登录');
    },
  });
};

// 修改密码
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      await AuthService.changePassword(data);
      message.success('密码修改成功');
    },
    onError: (error: Error) => {
      message.error(error.message || '密码修改失败');
    },
  });
};

// 忘记密码
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (data: ForgotPasswordRequest) => {
      await AuthService.forgotPassword(data);
      message.success('密码重置邮件已发送，请查收');
    },
    onError: (error: Error) => {
      message.error(error.message || '发送重置邮件失败');
    },
  });
};

// 重置密码
export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (data: ResetPasswordRequest) => {
      await AuthService.resetPassword(data);
      message.success('密码重置成功，请使用新密码登录');
    },
    onError: (error: Error) => {
      message.error(error.message || '密码重置失败');
    },
  });
};

// 验证邮箱
export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: async (token: string) => {
      await AuthService.verifyEmail(token);
      message.success('邮箱验证成功');
    },
    onError: (error: Error) => {
      message.error(error.message || '邮箱验证失败');
    },
  });
};

// 重发验证邮件
export const useResendVerificationEmail = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      await AuthService.resendVerificationEmail(email);
      message.success('验证邮件已重新发送，请查收');
    },
    onError: (error: Error) => {
      message.error(error.message || '发送验证邮件失败');
    },
  });
};

// 检查用户名可用性
export const useCheckUsernameAvailable = () => {
  return useMutation({
    mutationFn: async (username: string) => {
      const response = await AuthService.checkUsernameAvailable(username);
      return response;
    },
    onError: (error: Error) => {
      console.error('检查用户名可用性失败:', error);
    },
  });
};

// 检查邮箱可用性
export const useCheckEmailAvailable = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await AuthService.checkEmailAvailable(email);
      return response;
    },
    onError: (error: Error) => {
      console.error('检查邮箱可用性失败:', error);
    },
  });
}; 
