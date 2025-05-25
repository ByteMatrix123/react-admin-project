/**
 * 认证服务 - 与FastAPI后端集成
 */
import apiClient from '../utils/api';
import type { 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse,
  RegisterResponse,
  AuthUser,
  RefreshTokenResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from '../types/auth';

export class AuthService {
  // 用户登录
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response: LoginResponse = await apiClient.post('/auth/login', credentials);
    
    // 存储token到localStorage
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    
    return response;
  }

  // 用户注册
  static async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response: RegisterResponse = await apiClient.post('/auth/register', userData);
    return response;
  }

  // 获取当前用户信息
  static async getCurrentUser(): Promise<AuthUser> {
    const response: AuthUser = await apiClient.get('/auth/me');
    return response;
  }

  // 刷新Token
  static async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response: RefreshTokenResponse = await apiClient.post('/auth/refresh', {
      refresh_token: refreshToken
    });
    
    // 更新localStorage中的token
    localStorage.setItem('access_token', response.access_token);
    
    return response;
  }

  // 用户登出
  static async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // 无论API调用是否成功，都清除本地存储
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  // 修改密码
  static async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.post('/users/me/change-password', data);
  }

  // 忘记密码
  static async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await apiClient.post('/auth/forgot-password', data);
  }

  // 重置密码
  static async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await apiClient.post('/auth/reset-password', data);
  }

  // 验证邮箱
  static async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { token });
  }

  // 重发验证邮件
  static async resendVerificationEmail(email: string): Promise<void> {
    await apiClient.post('/auth/resend-verification', { email });
  }

  // 检查用户名是否可用
  static async checkUsernameAvailable(username: string): Promise<boolean> {
    try {
      const response: { available: boolean } = await apiClient.get(`/auth/check-username/${username}`);
      return response.available === true;
    } catch {
      return false;
    }
  }

  // 检查邮箱是否可用
  static async checkEmailAvailable(email: string): Promise<boolean> {
    try {
      const response: { available: boolean } = await apiClient.get(`/auth/check-email/${email}`);
      return response.available === true;
    } catch {
      return false;
    }
  }
} 
