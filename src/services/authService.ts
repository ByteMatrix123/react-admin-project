import type { 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse, 
  AuthUser,
  PasswordResetRequest,
  PasswordChangeRequest
} from '../types/auth';
import type { ApiResponse } from '../types/common';
import { mockUsers } from './mockData';

// 模拟API延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 生成JWT token (模拟)
const generateToken = (user: any) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    sub: user.id, 
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
  }));
  const signature = btoa('mock-signature');
  return `${header}.${payload}.${signature}`;
};

// 生成刷新token
const generateRefreshToken = () => {
  return btoa(Math.random().toString(36) + Date.now().toString());
};

export const authService = {
  // 用户登录
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse | null>> {
    await delay(800);

    const { username, password } = credentials;

    // 查找用户
    const user = mockUsers.find(u => 
      u.username === username || u.email === username
    );

    if (!user) {
      return {
        code: 404,
        message: '用户不存在',
        success: false,
        data: null,
      };
    }

    // 模拟密码验证 (实际项目中应该验证加密后的密码)
    if (password !== '123456') {
      return {
        code: 401,
        message: '密码错误',
        success: false,
        data: null,
      };
    }

    // 检查用户状态
    if (user.status === 'inactive') {
      return {
        code: 403,
        message: '账户已被禁用，请联系管理员',
        success: false,
        data: null,
      };
    }

    if (user.status === 'pending') {
      return {
        code: 403,
        message: '账户待审核，请等待管理员审核',
        success: false,
        data: null,
      };
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken();

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      realName: user.realName,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      permissions: user.permissions,
      token,
    };

    const loginResponse: LoginResponse = {
      user: authUser,
      token,
      refreshToken,
      expiresIn: 24 * 60 * 60, // 24小时
    };

    // 更新最后登录时间
    user.lastLoginAt = new Date().toISOString();

    return {
      code: 200,
      message: '登录成功',
      success: true,
      data: loginResponse,
    };
  },

  // 用户注册
  async register(userData: RegisterRequest): Promise<ApiResponse<AuthUser | null>> {
    await delay(1000);

    // 检查用户名是否已存在
    const existingUser = mockUsers.find(u => u.username === userData.username);
    if (existingUser) {
      return {
        code: 400,
        message: '用户名已存在',
        success: false,
        data: null,
      };
    }

    // 检查邮箱是否已存在
    const existingEmail = mockUsers.find(u => u.email === userData.email);
    if (existingEmail) {
      return {
        code: 400,
        message: '邮箱已被注册',
        success: false,
        data: null,
      };
    }

    // 验证密码确认
    if (userData.password !== userData.confirmPassword) {
      return {
        code: 400,
        message: '两次输入的密码不一致',
        success: false,
        data: null,
      };
    }

    // 创建新用户
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      username: userData.username,
      email: userData.email,
      phone: userData.phone,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
      realName: userData.realName,
      department: userData.department,
      position: userData.position,
      status: 'pending' as const, // 新注册用户需要审核
      role: 'user' as const,
      permissions: ['user:read', 'profile:update'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 添加到用户列表
    mockUsers.push(newUser);

    const token = generateToken(newUser);

    const authUser: AuthUser = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      realName: newUser.realName,
      avatar: newUser.avatar,
      role: newUser.role,
      status: newUser.status,
      permissions: newUser.permissions,
      token,
    };

    return {
      code: 200,
      message: '注册成功，请等待管理员审核',
      success: true,
      data: authUser,
    };
  },

  // 刷新token
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string; refreshToken: string } | null>> {
    await delay(300);

    // 模拟token刷新逻辑
    if (!refreshToken) {
      return {
        code: 401,
        message: 'Refresh token无效',
        success: false,
        data: null,
      };
    }

    const newToken = generateToken({ id: 'mock', username: 'mock', role: 'user' });
    const newRefreshToken = generateRefreshToken();

    return {
      code: 200,
      message: 'Token刷新成功',
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    };
  },

  // 获取当前用户信息
  async getCurrentUser(token: string): Promise<ApiResponse<AuthUser | null>> {
    await delay(300);

    if (!token) {
      return {
        code: 401,
        message: '未授权',
        success: false,
        data: null,
      };
    }

    // 模拟从token解析用户信息
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user = mockUsers.find(u => u.id === payload.sub);

      if (!user) {
        return {
          code: 404,
          message: '用户不存在',
          success: false,
          data: null,
        };
      }

      const authUser: AuthUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        realName: user.realName,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        permissions: user.permissions,
        token,
      };

      return {
        code: 200,
        message: '获取用户信息成功',
        success: true,
        data: authUser,
      };
    } catch (error) {
      return {
        code: 401,
        message: 'Token无效',
        success: false,
        data: null,
      };
    }
  },

  // 忘记密码
  async forgotPassword(data: PasswordResetRequest): Promise<ApiResponse<null>> {
    await delay(500);

    const user = mockUsers.find(u => u.email === data.email);
    
    if (!user) {
      return {
        code: 404,
        message: '邮箱不存在',
        success: false,
        data: null,
      };
    }

    return {
      code: 200,
      message: '密码重置邮件已发送，请查收邮箱',
      success: true,
      data: null,
    };
  },

  // 修改密码
  async changePassword(data: PasswordChangeRequest): Promise<ApiResponse<null>> {
    await delay(500);

    // 模拟验证旧密码
    if (data.oldPassword !== '123456') {
      return {
        code: 400,
        message: '原密码错误',
        success: false,
        data: null,
      };
    }

    if (data.newPassword !== data.confirmPassword) {
      return {
        code: 400,
        message: '两次输入的新密码不一致',
        success: false,
        data: null,
      };
    }

    return {
      code: 200,
      message: '密码修改成功',
      success: true,
      data: null,
    };
  },

  // 登出
  async logout(): Promise<ApiResponse<null>> {
    await delay(200);

    return {
      code: 200,
      message: '登出成功',
      success: true,
      data: null,
    };
  },
}; 
