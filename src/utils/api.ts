import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { message } from 'antd';

// API配置
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// 创建axios实例
const apiClient: AxiosInstance = axios.create(API_CONFIG);

// 生成请求ID用于追踪
const generateRequestId = (): string => {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 请求拦截器
apiClient.interceptors.request.use(
  (config: any) => {
    // 从localStorage获取token
    const token = localStorage.getItem('access_token');
    
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
    const { response, config } = error;
    
    if (response?.status === 401 && !config._retry) {
      config._retry = true;
      
      // Token过期，尝试刷新
      const refreshed = await refreshToken();
      if (refreshed) {
        // 重试原请求
        const newToken = localStorage.getItem('access_token');
        config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient.request(config);
      } else {
        // 刷新失败，跳转登录
        clearAuthAndRedirect();
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
  } else if (response?.data?.detail) {
    message.error(response.data.detail);
  } else if (error.message) {
    message.error(error.message);
  } else {
    message.error('网络请求失败，请稍后重试');
  }
};

// Token刷新函数
const refreshToken = async (): Promise<boolean> => {
  try {
    const refreshTokenValue = localStorage.getItem('refresh_token');
    if (!refreshTokenValue) return false;
    
    const response = await axios.post(`${API_CONFIG.baseURL}/auth/refresh`, {
      refresh_token: refreshTokenValue
    });
    
    if (response.data?.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
};

// 清除认证信息并跳转登录
const clearAuthAndRedirect = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  
  // 通知其他组件认证状态已清除
  window.dispatchEvent(new CustomEvent('auth-cleared'));
  
  // 跳转到登录页面
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

export default apiClient; 
