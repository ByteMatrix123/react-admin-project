/**
 * 用户服务 - 与FastAPI后端集成
 */
import apiClient from '../utils/api';
import type { 
  User, 
  UserListParams, 
  CreateUserRequest, 
  UpdateUserRequest,
  UpdateProfileRequest,
  UpdateUserSettingsRequest,
  BatchDeleteUsersResponse,
  ResetPasswordResponse,
  AssignUserRolesRequest,
  RemoveUserRolesRequest,
  UserRoleAssignResponse,
  UserRoleRemoveResponse
} from '../types/user';
import type { PaginatedResponse } from '../types/api';
import type { Role } from '../types/auth';

export class UserService {
  // 获取用户列表
  static async getUsers(params: UserListParams): Promise<PaginatedResponse<User>> {
    const response: PaginatedResponse<User> = await apiClient.get('/users', {
      params: {
        page: params.page,
        page_size: params.page_size,
        search: params.search,
        department: params.department,
        is_active: params.is_active,
        is_verified: params.is_verified,
        role_id: params.role_id,
        sort: params.sort,
        order: params.order,
      }
    });
    
    return response;
  }

  // 获取用户详情
  static async getUserById(id: number): Promise<User> {
    const response: User = await apiClient.get(`/users/${id}`);
    return response;
  }

  // 创建用户
  static async createUser(userData: CreateUserRequest): Promise<User> {
    const response: User = await apiClient.post('/users', userData);
    return response;
  }

  // 更新用户
  static async updateUser(id: number, userData: UpdateUserRequest): Promise<User> {
    const response: User = await apiClient.put(`/users/${id}`, userData);
    return response;
  }

  // 删除用户
  static async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  }

  // 批量删除用户
  static async batchDeleteUsers(userIds: number[]): Promise<BatchDeleteUsersResponse> {
    const response: BatchDeleteUsersResponse = await apiClient.delete('/users/batch', {
      data: { user_ids: userIds }
    });
    return response;
  }

  // 重置用户密码
  static async resetPassword(id: number): Promise<ResetPasswordResponse> {
    const response: ResetPasswordResponse = await apiClient.post(`/users/${id}/reset-password`);
    return response;
  }

  // 获取用户角色
  static async getUserRoles(userId: number): Promise<Role[]> {
    const response: Role[] = await apiClient.get(`/users/${userId}/roles`);
    return response;
  }

  // 分配用户角色
  static async assignUserRoles(userId: number, data: AssignUserRolesRequest): Promise<UserRoleAssignResponse> {
    const response: UserRoleAssignResponse = await apiClient.post(`/users/${userId}/roles`, data);
    return response;
  }

  // 移除用户角色
  static async removeUserRoles(userId: number, data: RemoveUserRolesRequest): Promise<UserRoleRemoveResponse> {
    const response: UserRoleRemoveResponse = await apiClient.delete(`/users/${userId}/roles`, {
      data
    });
    return response;
  }

  // 更新个人资料
  static async updateProfile(userId: number, data: UpdateProfileRequest): Promise<User> {
    const response: User = await apiClient.put(`/users/${userId}/profile`, data);
    return response;
  }

  // 更新用户设置
  static async updateUserSettings(userId: number, data: UpdateUserSettingsRequest): Promise<void> {
    await apiClient.put(`/users/${userId}/settings`, data);
  }

  // 获取用户设置
  static async getUserSettings(userId: number): Promise<UpdateUserSettingsRequest> {
    const response: UpdateUserSettingsRequest = await apiClient.get(`/users/${userId}/settings`);
    return response;
  }

  // 激活用户
  static async activateUser(id: number): Promise<void> {
    await apiClient.post(`/users/${id}/activate`);
  }

  // 禁用用户
  static async deactivateUser(id: number): Promise<void> {
    await apiClient.post(`/users/${id}/deactivate`);
  }

  // 验证用户邮箱
  static async verifyUserEmail(id: number): Promise<void> {
    await apiClient.post(`/users/${id}/verify-email`);
  }

  // 重发验证邮件
  static async resendVerificationEmail(id: number): Promise<void> {
    await apiClient.post(`/users/${id}/resend-verification`);
  }
} 
