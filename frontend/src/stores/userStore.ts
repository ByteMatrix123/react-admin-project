import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { UserListParams } from '../types/user';

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
  toggleUserSelection: (id: number) => void;
  selectAllUsers: (userIds: number[]) => void;
}

const defaultSearchParams: UserListParams = {
  page: 1,
  page_size: 20,
  search: '',
  department: undefined,
  is_active: undefined,
  is_verified: undefined,
  role_id: undefined,
  sort: 'created_at',
  order: 'desc',
};

export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      searchParams: defaultSearchParams,
      selectedUserIds: [],

      // 设置搜索参数
      setSearchParams: (params) => {
        set((state) => ({
          searchParams: { 
            ...state.searchParams, 
            ...params, 
            page: params.page !== undefined ? params.page : 1 // 除非明确指定页码，否则重置为第一页
          },
        }), false, 'setSearchParams');
      },

      // 重置搜索参数
      resetSearchParams: () => {
        set({ 
          searchParams: defaultSearchParams,
          selectedUserIds: [] // 重置时也清除选中状态
        }, false, 'resetSearchParams');
      },

      // 设置选中的用户
      setSelectedUserIds: (ids) => {
        set({ selectedUserIds: ids }, false, 'setSelectedUserIds');
      },

      // 清除选中的用户
      clearSelectedUserIds: () => {
        set({ selectedUserIds: [] }, false, 'clearSelectedUserIds');
      },

      // 切换用户选中状态
      toggleUserSelection: (id) => {
        set((state) => {
          const isSelected = state.selectedUserIds.includes(id);
          const newSelectedIds = isSelected
            ? state.selectedUserIds.filter(selectedId => selectedId !== id)
            : [...state.selectedUserIds, id];
          
          return { selectedUserIds: newSelectedIds };
        }, false, 'toggleUserSelection');
      },

      // 全选用户
      selectAllUsers: (userIds) => {
        const { selectedUserIds } = get();
        const allSelected = userIds.every(id => selectedUserIds.includes(id));
        
        set({
          selectedUserIds: allSelected ? [] : userIds
        }, false, 'selectAllUsers');
      },
    }),
    {
      name: 'user-store',
    }
  )
); 
