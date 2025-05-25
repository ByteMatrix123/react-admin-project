export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  realName: string;
  department: string;
  position: string;
  status: 'active' | 'inactive' | 'pending';
  role: 'admin' | 'manager' | 'user';
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  phone?: string;
  realName: string;
  department: string;
  position: string;
  employeeId?: string;
  role?: 'admin' | 'manager' | 'user';
  permissions?: string[];
}

export interface UserCreateRequest extends CreateUserRequest {}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id?: string;
  status?: 'active' | 'inactive' | 'pending';
}

export interface UserUpdateRequest extends UpdateUserRequest {}

export interface UserListParams {
  page: number;
  pageSize: number;
  keyword?: string;
  department?: string;
  status?: 'active' | 'inactive' | 'pending';
  role?: 'admin' | 'manager' | 'user';
}

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
} 
