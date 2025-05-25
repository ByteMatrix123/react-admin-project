import type { 
  User, 
  UserListParams, 
  UserListResponse, 
  CreateUserRequest, 
  UpdateUserRequest 
} from '../types/user';
import type { ApiResponse } from '../types/common';
import { mockUsers } from './mockData';

// 模拟API延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 生成随机ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// 模拟用户数据存储
let users = [...mockUsers];

export const userService = {
  // 获取用户列表
  async getUserList(params: UserListParams): Promise<ApiResponse<UserListResponse>> {
    await delay(500); // 模拟网络延迟

    let filteredUsers = [...users];

    // 关键词搜索
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.username.toLowerCase().includes(keyword) ||
        user.realName.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.phone?.toLowerCase().includes(keyword)
      );
    }

    // 部门筛选
    if (params.department) {
      filteredUsers = filteredUsers.filter(user => user.department === params.department);
    }

    // 状态筛选
    if (params.status) {
      filteredUsers = filteredUsers.filter(user => user.status === params.status);
    }

    // 角色筛选
    if (params.role) {
      filteredUsers = filteredUsers.filter(user => user.role === params.role);
    }

    // 分页
    const total = filteredUsers.length;
    const startIndex = (params.page - 1) * params.pageSize;
    const endIndex = startIndex + params.pageSize;
    const data = filteredUsers.slice(startIndex, endIndex);

    return {
      code: 200,
      message: '获取成功',
      success: true,
      data: {
        data,
        total,
        page: params.page,
        pageSize: params.pageSize,
      },
    };
  },

  // 获取用户详情
  async getUserById(id: string): Promise<ApiResponse<User | null>> {
    await delay(300);

    const user = users.find(u => u.id === id);
    
    if (!user) {
      return {
        code: 404,
        message: '用户不存在',
        success: false,
        data: null,
      };
    }

    return {
      code: 200,
      message: '获取成功',
      success: true,
      data: user,
    };
  },

  // 创建用户
  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User | null>> {
    await delay(800);

    // 检查用户名是否已存在
    const existingUser = users.find(u => u.username === userData.username);
    if (existingUser) {
      return {
        code: 400,
        message: '用户名已存在',
        success: false,
        data: null,
      };
    }

    // 检查邮箱是否已存在
    const existingEmail = users.find(u => u.email === userData.email);
    if (existingEmail) {
      return {
        code: 400,
        message: '邮箱已存在',
        success: false,
        data: null,
      };
    }

    const newUser: User = {
      id: generateId(),
      ...userData,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.unshift(newUser);

    return {
      code: 200,
      message: '创建成功',
      success: true,
      data: newUser,
    };
  },

  // 更新用户
  async updateUser(userData: UpdateUserRequest): Promise<ApiResponse<User | null>> {
    await delay(600);

    const userIndex = users.findIndex(u => u.id === userData.id);
    
    if (userIndex === -1) {
      return {
        code: 404,
        message: '用户不存在',
        success: false,
        data: null,
      };
    }

    // 检查用户名是否已被其他用户使用
    if (userData.username) {
      const existingUser = users.find(u => u.username === userData.username && u.id !== userData.id);
      if (existingUser) {
        return {
          code: 400,
          message: '用户名已存在',
          success: false,
          data: null,
        };
      }
    }

    // 检查邮箱是否已被其他用户使用
    if (userData.email) {
      const existingEmail = users.find(u => u.email === userData.email && u.id !== userData.id);
      if (existingEmail) {
        return {
          code: 400,
          message: '邮箱已存在',
          success: false,
          data: null,
        };
      }
    }

    const updatedUser: User = {
      ...users[userIndex],
      ...userData,
      updatedAt: new Date().toISOString(),
    };

    users[userIndex] = updatedUser;

    return {
      code: 200,
      message: '更新成功',
      success: true,
      data: updatedUser,
    };
  },

  // 删除用户
  async deleteUser(id: string): Promise<ApiResponse<null>> {
    await delay(400);

    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return {
        code: 404,
        message: '用户不存在',
        success: false,
        data: null,
      };
    }

    users.splice(userIndex, 1);

    return {
      code: 200,
      message: '删除成功',
      success: true,
      data: null,
    };
  },

  // 批量删除用户
  async batchDeleteUsers(ids: string[]): Promise<ApiResponse<null>> {
    await delay(600);

    users = users.filter(user => !ids.includes(user.id));

    return {
      code: 200,
      message: `成功删除 ${ids.length} 个用户`,
      success: true,
      data: null,
    };
  },

  // 重置用户密码
  async resetPassword(id: string): Promise<ApiResponse<null>> {
    await delay(500);

    const user = users.find(u => u.id === id);
    
    if (!user) {
      return {
        code: 404,
        message: '用户不存在',
        success: false,
        data: null,
      };
    }

    return {
      code: 200,
      message: '密码重置成功，新密码已发送至用户邮箱',
      success: true,
      data: null,
    };
  },
}; 
