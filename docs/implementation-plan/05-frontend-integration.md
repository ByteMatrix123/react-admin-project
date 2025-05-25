# 前端集成改造方案

## 🎯 改造目标

### 核心目标
- **API集成**: 将Mock数据替换为真实API调用
- **状态管理优化**: 优化Zustand状态管理策略
- **缓存策略**: 完善TanStack Query缓存机制
- **错误处理**: 统一错误处理和用户反馈
- **性能优化**: 提升应用响应速度和用户体验

### 技术要求
- 保持现有UI组件不变
- 最小化代码变更
- 向后兼容性
- 渐进式迁移

## 🔄 API集成策略

### 1. API客户端配置

#### Axios配置 (src/utils/api.ts)
```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '@/stores/authStore';

// API配置
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// 创建axios实例
const apiClient: AxiosInstance = axios.create(API_CONFIG);

// 请求拦截器
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const { token } = useAuthStore.getState();
    
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    
    // 添加请求ID用于追踪
    config.headers['X-Request-ID'] = generateRequestId();
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 统一处理成功响应
    return response.data;
  },
  async (error) => {
    const { response } = error;
    
    if (response?.status === 401) {
      // Token过期，尝试刷新
      const refreshed = await refreshToken();
      if (refreshed) {
        // 重试原请求
        return apiClient.request(error.config);
      } else {
        // 刷新失败，跳转登录
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
      }
    }
    
    // 统一错误处理
    handleApiError(error);
    return Promise.reject(error);
  }
);

// 错误处理函数
const handleApiError = (error: any) => {
  const { response } = error;
  
  if (response?.data?.message) {
    message.error(response.data.message);
  } else if (error.message) {
    message.error(error.message);
  } else {
    message.error('网络请求失败，请稍后重试');
  }
};

// Token刷新函数
const refreshToken = async (): Promise<boolean> => {
  try {
    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) return false;
    
    const response = await axios.post('/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${refreshToken}` }
    });
    
    const { access_token } = response.data.data;
    useAuthStore.getState().setToken(access_token);
    return true;
  } catch {
    return false;
  }
};

export default apiClient;
```

### 2. API响应类型定义

#### 通用响应类型 (src/types/api.ts)
```typescript
// 基础API响应
export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  meta?: {
    timestamp: string;
    request_id: string;
    version: string;
  };
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// 错误响应
export interface ApiError {
  success: false;
  code: number;
  message: string;
  error: {
    type: string;
    details: Array<{
      field: string;
      message: string;
      code: string;
    }>;
  };
  meta: {
    timestamp: string;
    request_id: string;
  };
}
```

## 🔧 服务层改造

### 1. 用户服务改造 (src/services/userService.ts)
```typescript
import apiClient from '@/utils/api';
import type { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserListParams,
  UserListResponse 
} from '@/types/user';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

export class UserService {
  // 获取用户列表
  static async getUsers(params: UserListParams): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>('/users', {
      params: {
        page: params.page,
        page_size: params.pageSize,
        search: params.search,
        department: params.department,
        is_active: params.isActive,
        sort: params.sortBy,
        order: params.sortOrder,
      }
    });
    return response.data;
  }

  // 获取用户详情
  static async getUserById(id: number): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  }

  // 创建用户
  static async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>('/users', userData);
    return response.data;
  }

  // 更新用户
  static async updateUser(id: number, userData: UpdateUserRequest): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, userData);
    return response.data;
  }

  // 删除用户
  static async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  }

  // 批量删除用户
  static async batchDeleteUsers(userIds: number[]): Promise<{ deleted_count: number; failed_ids: number[] }> {
    const response = await apiClient.delete<ApiResponse<{ deleted_count: number; failed_ids: number[] }>>('/users/batch', {
      data: { user_ids: userIds }
    });
    return response.data;
  }

  // 重置密码
  static async resetPassword(id: number): Promise<{ temporary_password: string }> {
    const response = await apiClient.post<ApiResponse<{ temporary_password: string }>>(`/users/${id}/reset-password`);
    return response.data;
  }

  // 分配用户角色
  static async assignUserRoles(userId: number, roleIds: number[]): Promise<void> {
    await apiClient.post(`/users/${userId}/roles`, { role_ids: roleIds });
  }

  // 移除用户角色
  static async removeUserRoles(userId: number, roleIds: number[]): Promise<void> {
    await apiClient.delete(`/users/${userId}/roles`, { data: { role_ids: roleIds } });
  }
}
```

### 2. 认证服务改造 (src/services/authService.ts)
```typescript
import apiClient from '@/utils/api';
import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthUser, 
  LoginResponse 
} from '@/types/auth';
import type { ApiResponse } from '@/types/api';

export class AuthService {
  // 用户登录
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    return response.data;
  }

  // 用户注册
  static async register(userData: RegisterRequest): Promise<{ user_id: number; verification_required: boolean }> {
    const response = await apiClient.post<ApiResponse<{ user_id: number; verification_required: boolean }>>('/auth/register', userData);
    return response.data;
  }

  // 获取当前用户信息
  static async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
    return response.data;
  }

  // 刷新Token
  static async refreshToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    const response = await apiClient.post<ApiResponse<{ access_token: string; expires_in: number }>>('/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${refreshToken}` }
    });
    return response.data;
  }

  // 用户登出
  static async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }

  // 修改密码
  static async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword
    });
  }

  // 忘记密码
  static async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  }
}
```

## 🔄 React Query集成改造

### 1. 用户查询Hooks改造 (src/hooks/useUserQuery.ts)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { UserService } from '@/services/userService';
import type { User, UserListParams, CreateUserRequest, UpdateUserRequest } from '@/types/user';

// 查询键工厂
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
};

// 获取用户列表
export const useUserList = (params: UserListParams) => {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => UserService.getUsers(params),
    staleTime: 5 * 60 * 1000, // 5分钟
    cacheTime: 10 * 60 * 1000, // 10分钟
    keepPreviousData: true, // 保持上一次数据，避免加载闪烁
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
      message.error(error.response?.data?.message || '创建用户失败');
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
      message.error(error.response?.data?.message || '更新用户失败');
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
      message.error(error.response?.data?.message || '删除用户失败');
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
      message.error(error.response?.data?.message || '批量删除失败');
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
      message.error(error.response?.data?.message || '密码重置失败');
    },
  });
};
```

### 2. 认证查询Hooks改造 (src/hooks/useAuthQuery.ts)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { AuthService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import type { LoginRequest, RegisterRequest } from '@/types/auth';

// 查询键
export const authKeys = {
  currentUser: ['auth', 'currentUser'] as const,
};

// 获取当前用户信息
export const useCurrentUser = () => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: authKeys.currentUser,
    queryFn: AuthService.getCurrentUser,
    enabled: isAuthenticated, // 只有在已认证时才查询
    staleTime: 5 * 60 * 1000,
    retry: false, // 认证失败不重试
  });
};

// 用户登录
export const useLogin = () => {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials: LoginRequest) => AuthService.login(credentials),
    onSuccess: (response) => {
      // 设置认证状态
      setAuth(response.user, response.access_token, response.refresh_token);
      
      // 设置用户信息缓存
      queryClient.setQueryData(authKeys.currentUser, response.user);
      
      message.success('登录成功');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '登录失败');
    },
  });
};

// 用户注册
export const useRegister = () => {
  return useMutation({
    mutationFn: (userData: RegisterRequest) => AuthService.register(userData),
    onSuccess: (result) => {
      if (result.verification_required) {
        message.success('注册成功，请查收验证邮件');
      } else {
        message.success('注册成功');
      }
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '注册失败');
    },
  });
};

// 用户登出
export const useLogout = () => {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: AuthService.logout,
    onSuccess: () => {
      // 清除认证状态
      clearAuth();
      
      // 清除所有查询缓存
      queryClient.clear();
      
      message.success('登出成功');
    },
    onError: (error: any) => {
      // 即使API调用失败，也要清除本地状态
      clearAuth();
      queryClient.clear();
      
      message.warning('登出时发生错误，但已清除本地状态');
    },
  });
};

// 修改密码
export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) => 
      AuthService.changePassword(oldPassword, newPassword),
    onSuccess: () => {
      message.success('密码修改成功');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '密码修改失败');
    },
  });
};

// 忘记密码
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => AuthService.forgotPassword(email),
    onSuccess: () => {
      message.success('密码重置邮件已发送，请查收');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '发送重置邮件失败');
    },
  });
};
```

## 🗃️ 状态管理优化

### 1. 认证状态优化 (src/stores/authStore.ts)
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser } from '@/types/auth';

interface AuthState {
  // 状态
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  // 操作
  setAuth: (user: AuthUser, token: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
  checkAuthenticated: () => boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      // 设置认证信息
      setAuth: (user, token, refreshToken) => {
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
        });
      },

      // 设置用户信息
      setUser: (user) => {
        set({ user });
      },

      // 设置Token
      setToken: (token) => {
        set({ token });
      },

      // 清除认证信息
      clearAuth: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      // 检查是否已认证
      checkAuthenticated: () => {
        const { token, user } = get();
        return !!(token && user);
      },

      // 检查权限
      hasPermission: (permission) => {
        const { user } = get();
        return user?.permissions?.includes(permission) ?? false;
      },

      // 检查角色
      hasRole: (role) => {
        const { user } = get();
        return user?.roles?.includes(role) ?? false;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### 2. 用户状态简化 (src/stores/userStore.ts)
```typescript
import { create } from 'zustand';
import type { UserListParams } from '@/types/user';

interface UserState {
  // 搜索参数
  searchParams: UserListParams;
  
  // 选中的用户
  selectedUserIds: number[];
  
  // 操作
  setSearchParams: (params: Partial<UserListParams>) => void;
  resetSearchParams: () => void;
  setSelectedUserIds: (ids: number[]) => void;
  clearSelectedUserIds: () => void;
}

const defaultSearchParams: UserListParams = {
  page: 1,
  pageSize: 20,
  search: '',
  department: '',
  isActive: undefined,
  sortBy: 'created_at',
  sortOrder: 'desc',
};

export const useUserStore = create<UserState>((set) => ({
  // 初始状态
  searchParams: defaultSearchParams,
  selectedUserIds: [],

  // 设置搜索参数
  setSearchParams: (params) => {
    set((state) => ({
      searchParams: { ...state.searchParams, ...params, page: 1 }, // 重置页码
    }));
  },

  // 重置搜索参数
  resetSearchParams: () => {
    set({ searchParams: defaultSearchParams });
  },

  // 设置选中的用户
  setSelectedUserIds: (ids) => {
    set({ selectedUserIds: ids });
  },

  // 清除选中的用户
  clearSelectedUserIds: () => {
    set({ selectedUserIds: [] });
  },
}));
```

## 🎨 组件改造

### 1. 用户管理页面改造 (src/pages/UserManagement.tsx)
```typescript
import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Input, 
  Select, 
  Card, 
  Modal, 
  message,
  Popconfirm 
} from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useUserList, useDeleteUser, useBatchDeleteUsers } from '@/hooks/useUserQuery';
import { useUserStore } from '@/stores/userStore';
import UserForm from '@/components/UserForm';
import UserDetail from '@/components/UserDetail';
import type { User } from '@/types/user';

const UserManagement: React.FC = () => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 状态管理
  const { 
    searchParams, 
    selectedUserIds, 
    setSearchParams, 
    setSelectedUserIds, 
    clearSelectedUserIds 
  } = useUserStore();

  // 查询和变更
  const { data, isLoading, error, refetch } = useUserList(searchParams);
  const deleteUserMutation = useDeleteUser();
  const batchDeleteMutation = useBatchDeleteUsers();

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchParams({ search: value });
  };

  // 处理筛选
  const handleFilter = (field: string, value: any) => {
    setSearchParams({ [field]: value });
  };

  // 处理分页
  const handlePageChange = (page: number, pageSize: number) => {
    setSearchParams({ page, pageSize });
  };

  // 处理排序
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    if (sorter.field) {
      setSearchParams({
        sortBy: sorter.field,
        sortOrder: sorter.order === 'ascend' ? 'asc' : 'desc',
      });
    }
  };

  // 处理删除
  const handleDelete = async (id: number) => {
    try {
      await deleteUserMutation.mutateAsync(id);
    } catch (error) {
      // 错误已在mutation中处理
    }
  };

  // 处理批量删除
  const handleBatchDelete = async () => {
    if (selectedUserIds.length === 0) {
      message.warning('请选择要删除的用户');
      return;
    }

    try {
      await batchDeleteMutation.mutateAsync(selectedUserIds);
      clearSelectedUserIds();
    } catch (error) {
      // 错误已在mutation中处理
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      sorter: true,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '姓名',
      key: 'fullName',
      render: (record: User) => `${record.first_name} ${record.last_name}`,
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      filters: [
        { text: '技术部', value: '技术部' },
        { text: '产品部', value: '产品部' },
        { text: '运营部', value: '运营部' },
      ],
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <span style={{ color: isActive ? 'green' : 'red' }}>
          {isActive ? '活跃' : '禁用'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: true,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: User) => (
        <Space>
          <Button 
            type="link" 
            onClick={() => {
              setSelectedUser(record);
              setIsDetailVisible(true);
            }}
          >
            查看
          </Button>
          <Button 
            type="link" 
            onClick={() => {
              setEditingUser(record);
              setIsFormVisible(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 错误处理
  if (error) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>加载用户数据失败</p>
          <Button onClick={() => refetch()}>重试</Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            placeholder="搜索用户名或邮箱"
            allowClear
            style={{ width: 250 }}
            onSearch={handleSearch}
          />
          <Select
            placeholder="选择部门"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => handleFilter('department', value)}
          >
            <Select.Option value="技术部">技术部</Select.Option>
            <Select.Option value="产品部">产品部</Select.Option>
            <Select.Option value="运营部">运营部</Select.Option>
          </Select>
          <Select
            placeholder="用户状态"
            allowClear
            style={{ width: 120 }}
            onChange={(value) => handleFilter('isActive', value)}
          >
            <Select.Option value={true}>活跃</Select.Option>
            <Select.Option value={false}>禁用</Select.Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            刷新
          </Button>
        </Space>
      </Card>

      {/* 操作栏 */}
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingUser(null);
                setIsFormVisible(true);
              }}
            >
              新增用户
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />}
              disabled={selectedUserIds.length === 0}
              loading={batchDeleteMutation.isLoading}
              onClick={handleBatchDelete}
            >
              批量删除 ({selectedUserIds.length})
            </Button>
          </Space>
        </div>

        {/* 用户表格 */}
        <Table
          columns={columns}
          dataSource={data?.items || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: data?.pagination.page,
            pageSize: data?.pagination.page_size,
            total: data?.pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: handlePageChange,
          }}
          rowSelection={{
            selectedRowKeys: selectedUserIds,
            onChange: setSelectedUserIds,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 用户表单模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={isFormVisible}
        onCancel={() => setIsFormVisible(false)}
        footer={null}
        width={600}
      >
        <UserForm
          user={editingUser}
          onSuccess={() => {
            setIsFormVisible(false);
            setEditingUser(null);
          }}
          onCancel={() => setIsFormVisible(false)}
        />
      </Modal>

      {/* 用户详情模态框 */}
      <Modal
        title="用户详情"
        open={isDetailVisible}
        onCancel={() => setIsDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedUser && <UserDetail user={selectedUser} />}
      </Modal>
    </div>
  );
};

export default UserManagement;
```

## 🔧 环境配置

### 1. 环境变量配置 (.env.development)
```bash
# API配置
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_API_TIMEOUT=10000

# 认证配置
VITE_TOKEN_STORAGE_KEY=auth_token
VITE_REFRESH_TOKEN_STORAGE_KEY=refresh_token

# 文件上传配置
VITE_UPLOAD_MAX_SIZE=10485760
VITE_UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif

# 功能开关
VITE_ENABLE_MOCK=false
VITE_ENABLE_DEVTOOLS=true
```

### 2. 生产环境配置 (.env.production)
```bash
# API配置
VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_API_TIMEOUT=15000

# 认证配置
VITE_TOKEN_STORAGE_KEY=auth_token
VITE_REFRESH_TOKEN_STORAGE_KEY=refresh_token

# 文件上传配置
VITE_UPLOAD_MAX_SIZE=10485760
VITE_UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif

# 功能开关
VITE_ENABLE_MOCK=false
VITE_ENABLE_DEVTOOLS=false
```

## 📋 迁移检查清单

### 准备阶段
- [ ] 备份现有代码
- [ ] 创建新分支
- [ ] 配置环境变量
- [ ] 安装新依赖

### API集成阶段
- [ ] 配置API客户端
- [ ] 定义响应类型
- [ ] 改造服务层
- [ ] 更新错误处理

### 状态管理阶段
- [ ] 优化Zustand stores
- [ ] 更新React Query hooks
- [ ] 配置缓存策略
- [ ] 测试状态同步

### 组件改造阶段
- [ ] 更新页面组件
- [ ] 修改表单组件
- [ ] 调整列表组件
- [ ] 优化加载状态

### 测试验证阶段
- [ ] 功能测试
- [ ] 性能测试
- [ ] 错误处理测试
- [ ] 用户体验测试

### 部署准备阶段
- [ ] 构建配置优化
- [ ] 环境变量配置
- [ ] 错误监控配置
- [ ] 性能监控配置 
