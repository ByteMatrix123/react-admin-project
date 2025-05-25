import type { PaginatedResponse, QueryParams } from './api';
import type { Role } from './auth';

// 用户信息
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  department?: string;
  position?: string;
  birthday?: string;
  work_location?: string;
  bio?: string;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  roles: Role[];
}

// 用户列表查询参数
export interface UserListParams extends QueryParams {
  department?: string;
  is_active?: boolean;
  is_verified?: boolean;
  role_id?: number;
}

// 用户列表响应
export type UserListResponse = PaginatedResponse<User>;

// 创建用户请求
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  department?: string;
  position?: string;
  birthday?: string;
  work_location?: string;
  bio?: string;
  is_active?: boolean;
  role_ids?: number[];
}

// 更新用户请求
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  department?: string;
  position?: string;
  birthday?: string;
  work_location?: string;
  bio?: string;
  is_active?: boolean;
}

// 用户个人资料更新请求
export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  department?: string;
  position?: string;
  birthday?: string;
  work_location?: string;
  bio?: string;
}

// 用户设置更新请求
export interface UpdateUserSettingsRequest {
  language?: string;
  timezone?: string;
  theme?: string;
  notifications?: {
    email?: boolean;
    browser?: boolean;
    mobile?: boolean;
    system?: boolean;
  };
  privacy?: {
    show_online_status?: boolean;
    allow_data_collection?: boolean;
    share_usage_data?: boolean;
  };
}

// 批量删除用户请求
export interface BatchDeleteUsersRequest {
  user_ids: number[];
}

// 批量删除用户响应
export interface BatchDeleteUsersResponse {
  deleted_count: number;
  failed_ids: number[];
}

// 重置密码响应
export interface ResetPasswordResponse {
  temporary_password: string;
}

// 用户角色分配请求
export interface AssignUserRolesRequest {
  role_ids: number[];
  expires_at?: string;
}

// 用户角色移除请求
export interface RemoveUserRolesRequest {
  role_ids: number[];
}

// 用户角色分配响应
export interface UserRoleAssignResponse {
  assigned_count: number;
}

// 用户角色移除响应
export interface UserRoleRemoveResponse {
  removed_count: number;
} 
