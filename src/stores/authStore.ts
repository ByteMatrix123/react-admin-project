import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AuthUser, AuthState } from '../types/auth';
import { storage } from '../utils';

interface AuthActions {
  // 设置认证状态
  setAuth: (user: AuthUser, token: string, refreshToken: string) => void;
  
  // 清除认证状态
  clearAuth: () => void;
  
  // 设置用户信息
  setUser: (user: AuthUser) => void;
  
  // 设置加载状态
  setLoading: (loading: boolean) => void;
  
  // 设置错误信息
  setError: (error: string | null) => void;
  
  // 更新token
  updateToken: (token: string, refreshToken?: string) => void;
  
  // 检查是否已认证
  checkAuthenticated: () => boolean;
  
  // 检查权限
  hasPermission: (permission: string) => boolean;
  
  // 检查角色
  hasRole: (role: string | string[]) => boolean;
  
  // 初始化认证状态
  initAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  refreshToken: null,
  loading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // 设置认证状态
        setAuth: (user, token, refreshToken) => {
          set({
            isAuthenticated: true,
            user,
            token,
            refreshToken,
            error: null,
          }, false, 'setAuth');
          
          // 存储到localStorage
          storage.set('auth_token', token);
          storage.set('auth_refresh_token', refreshToken);
        },

        // 清除认证状态
        clearAuth: () => {
          set({
            isAuthenticated: false,
            user: null,
            token: null,
            refreshToken: null,
            error: null,
          }, false, 'clearAuth');
          
          // 清除localStorage
          storage.remove('auth_token');
          storage.remove('auth_refresh_token');
        },

        // 设置用户信息
        setUser: (user) => {
          set({ user }, false, 'setUser');
        },

        // 设置加载状态
        setLoading: (loading) => {
          set({ loading }, false, 'setLoading');
        },

        // 设置错误信息
        setError: (error) => {
          set({ error }, false, 'setError');
        },

        // 更新token
        updateToken: (token, refreshToken) => {
          set((state) => ({
            token,
            refreshToken: refreshToken || state.refreshToken,
          }), false, 'updateToken');
          
          storage.set('auth_token', token);
          if (refreshToken) {
            storage.set('auth_refresh_token', refreshToken);
          }
        },

        // 检查是否已认证
        checkAuthenticated: () => {
          const state = get();
          return state.isAuthenticated && !!state.token && !!state.user;
        },

        // 检查权限
        hasPermission: (permission) => {
          const state = get();
          if (!state.user) return false;
          
          // 管理员拥有所有权限
          if (state.user.permissions.includes('*')) return true;
          
          return state.user.permissions.includes(permission);
        },

        // 检查角色
        hasRole: (role) => {
          const state = get();
          if (!state.user) return false;
          
          if (Array.isArray(role)) {
            return role.includes(state.user.role);
          }
          
          return state.user.role === role;
        },

        // 初始化认证状态
        initAuth: () => {
          const token = storage.get('auth_token');
          const refreshToken = storage.get('auth_refresh_token');
          
          if (token && refreshToken) {
            set({
              token,
              refreshToken,
              isAuthenticated: true,
            }, false, 'initAuth');
          }
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
); 
