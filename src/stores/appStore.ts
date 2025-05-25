import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { BreadcrumbItem } from '../types/common';

interface AppState {
  // 侧边栏状态
  collapsed: boolean;
  
  // 当前选中的菜单
  selectedMenuKey: string;
  
  // 面包屑导航
  breadcrumbs: BreadcrumbItem[];
  
  // 主题设置
  theme: 'light' | 'dark';
  
  // 语言设置
  locale: 'zh-CN' | 'en-US';
  
  // 用户信息
  currentUser: {
    id: string;
    username: string;
    realName: string;
    avatar?: string;
    role: string;
    permissions: string[];
  } | null;
  
  // Actions
  toggleCollapsed: () => void;
  setSelectedMenuKey: (key: string) => void;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLocale: (locale: 'zh-CN' | 'en-US') => void;
  setCurrentUser: (user: AppState['currentUser']) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        collapsed: false,
        selectedMenuKey: '',
        breadcrumbs: [],
        theme: 'light',
        locale: 'zh-CN',
        currentUser: {
          id: '1',
          username: 'admin',
          realName: '系统管理员',
          avatar: '',
          role: 'admin',
          permissions: ['*'],
        },

        // Actions
        toggleCollapsed: () =>
          set((state) => ({ collapsed: !state.collapsed }), false, 'toggleCollapsed'),

        setSelectedMenuKey: (selectedMenuKey) =>
          set({ selectedMenuKey }, false, 'setSelectedMenuKey'),

        setBreadcrumbs: (breadcrumbs) =>
          set({ breadcrumbs }, false, 'setBreadcrumbs'),

        setTheme: (theme) =>
          set({ theme }, false, 'setTheme'),

        setLocale: (locale) =>
          set({ locale }, false, 'setLocale'),

        setCurrentUser: (currentUser) =>
          set({ currentUser }, false, 'setCurrentUser'),

        logout: () =>
          set({ currentUser: null, selectedMenuKey: '', breadcrumbs: [] }, false, 'logout'),
      }),
      {
        name: 'app-store',
        partialize: (state) => ({
          collapsed: state.collapsed,
          theme: state.theme,
          locale: state.locale,
          currentUser: state.currentUser,
        }),
      }
    ),
    {
      name: 'app-store',
    }
  )
); 
