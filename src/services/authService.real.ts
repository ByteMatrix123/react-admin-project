/**
 * Real authentication service that connects to FastAPI backend
 */
import { api } from './api';
import type { 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse, 
  AuthUser,
  PasswordResetRequest,
  PasswordChangeRequest
} from '../types/auth';
import type { ApiResponse } from '../types/common';

export const authService = {
  // 用户登录
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse | null>> {
    try {
      const response = await api.post<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
        user: {
          id: number;
          username: string;
          email: string;
          full_name?: string;
          first_name?: string;
          last_name?: string;
          phone?: string;
          avatar_url?: string;
          department?: string;
          position?: string;
          is_active: boolean;
          is_verified: boolean;
          is_superuser: boolean;
          roles: Array<{
            id: number;
            name: string;
            display_name: string;
            description?: string;
            is_active: boolean;
            is_system: boolean;
          }>;
        };
      }>('/api/auth/login', credentials);

      if (response.success && response.data) {
        const { access_token, refresh_token, expires_in, user } = response.data;

        // Store tokens
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        // Convert backend user to frontend AuthUser format
        const authUser: AuthUser = {
          id: user.id.toString(),
          username: user.username,
          email: user.email,
          realName: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
          avatar: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
          phone: user.phone || '',
          department: user.department || '',
          position: user.position || '',
          role: user.is_superuser ? 'admin' : 'user',
          status: user.is_active ? 'active' : 'inactive',
          permissions: user.roles.flatMap(role => [
            `${role.name}:read`,
            `${role.name}:write`,
            `${role.name}:delete`
          ]),
          token: access_token,
        };

        const loginResponse: LoginResponse = {
          user: authUser,
          token: access_token,
          refreshToken: refresh_token,
          expiresIn: expires_in,
        };

        return {
          code: 200,
          message: '登录成功',
          success: true,
          data: loginResponse,
        };
      }

      return {
        code: response.code,
        message: response.message,
        success: false,
        data: null,
      };
    } catch (error: any) {
      return {
        code: 500,
        message: error.message || '登录失败',
        success: false,
        data: null,
      };
    }
  },

  // 用户注册
  async register(userData: RegisterRequest): Promise<ApiResponse<AuthUser | null>> {
    try {
      const registerData = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        full_name: userData.realName,
        department: userData.department,
        position: userData.position,
        phone: userData.phone,
      };

      const response = await api.post<{
        id: number;
        username: string;
        email: string;
        full_name?: string;
        phone?: string;
        department?: string;
        position?: string;
        is_active: boolean;
        is_verified: boolean;
        is_superuser: boolean;
      }>('/api/auth/register', registerData);

      if (response.success && response.data) {
        const user = response.data;

        const authUser: AuthUser = {
          id: user.id.toString(),
          username: user.username,
          email: user.email,
          realName: user.full_name || user.username,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
          phone: user.phone || '',
          department: user.department || '',
          position: user.position || '',
          role: user.is_superuser ? 'admin' : 'user',
          status: user.is_active ? 'active' : 'pending',
          permissions: ['user:read', 'profile:update'],
          token: '',
        };

        return {
          code: 200,
          message: '注册成功，请等待管理员审核',
          success: true,
          data: authUser,
        };
      }

             return {
         code: response.code,
         message: response.message,
         success: false,
         data: null,
       };
     } catch (error: any) {
       return {
         code: 500,
         message: error.message || '注册失败',
         success: false,
         data: null,
       };
     }
  },

  // 刷新token
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ access_token: string; refresh_token: string } | null>> {
    try {
      const response = await api.post<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
      }>('/api/auth/refresh', { refresh_token: refreshToken });

      if (response.success && response.data) {
        const { access_token, refresh_token } = response.data;

        // Update stored tokens
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        return {
          code: 200,
          message: 'Token刷新成功',
          success: true,
          data: { access_token, refresh_token },
        };
      }

      return response as ApiResponse<{ access_token: string; refresh_token: string } | null>;
    } catch (error: any) {
      return {
        code: 500,
        message: error.message || 'Token刷新失败',
        success: false,
        data: null,
      };
    }
  },

  // 获取当前用户信息
  async getCurrentUser(token: string): Promise<ApiResponse<AuthUser | null>> {
    try {
      const response = await api.get<{
        id: number;
        username: string;
        email: string;
        full_name?: string;
        first_name?: string;
        last_name?: string;
        phone?: string;
        avatar_url?: string;
        department?: string;
        position?: string;
        is_active: boolean;
        is_verified: boolean;
        is_superuser: boolean;
        roles: Array<{
          id: number;
          name: string;
          display_name: string;
          description?: string;
          is_active: boolean;
          is_system: boolean;
        }>;
      }>('/api/users/me/profile');

      if (response.success && response.data) {
        const user = response.data;

        const authUser: AuthUser = {
          id: user.id.toString(),
          username: user.username,
          email: user.email,
          realName: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
          avatar: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
          phone: user.phone || '',
          department: user.department || '',
          position: user.position || '',
          role: user.is_superuser ? 'admin' : 'user',
          status: user.is_active ? 'active' : 'inactive',
          permissions: user.roles.flatMap(role => [
            `${role.name}:read`,
            `${role.name}:write`,
            `${role.name}:delete`
          ]),
          token,
        };

        return {
          code: 200,
          message: '获取用户信息成功',
          success: true,
          data: authUser,
        };
      }

             return {
         code: response.code,
         message: response.message,
         success: false,
         data: null,
       };
     } catch (error: any) {
       return {
         code: 500,
         message: error.message || '获取用户信息失败',
         success: false,
         data: null,
       };
     }
  },

  // 忘记密码
  async forgotPassword(data: PasswordResetRequest): Promise<ApiResponse<null>> {
    try {
      const response = await api.post<{ message: string }>('/api/auth/forgot-password', {
        email: data.email,
      });

      return {
        code: response.code,
        message: response.data?.message || '密码重置邮件已发送',
        success: response.success,
        data: null,
      };
    } catch (error: any) {
      return {
        code: 500,
        message: error.message || '发送重置邮件失败',
        success: false,
        data: null,
      };
    }
  },

  // 修改密码
  async changePassword(data: PasswordChangeRequest): Promise<ApiResponse<null>> {
    try {
      const response = await api.post<{ message: string }>('/api/users/me/change-password', {
        current_password: data.oldPassword,
        new_password: data.newPassword,
      });

      return {
        code: response.code,
        message: response.data?.message || '密码修改成功',
        success: response.success,
        data: null,
      };
    } catch (error: any) {
      return {
        code: 500,
        message: error.message || '密码修改失败',
        success: false,
        data: null,
      };
    }
  },

  // 用户登出
  async logout(): Promise<ApiResponse<null>> {
    try {
      // Clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      // Optionally call backend logout endpoint
      await api.post('/api/auth/logout');

      return {
        code: 200,
        message: '登出成功',
        success: true,
        data: null,
      };
    } catch (error: any) {
      // Even if backend call fails, clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      return {
        code: 200,
        message: '登出成功',
        success: true,
        data: null,
      };
    }
  },
}; 
