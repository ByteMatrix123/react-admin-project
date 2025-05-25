import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, UserListParams } from '../types/user';

interface UserState {
  // 用户列表状态
  users: User[];
  total: number;
  loading: boolean;
  error: string | null;
  
  // 当前选中的用户
  selectedUser: User | null;
  
  // 搜索和筛选参数
  searchParams: UserListParams;
  
  // Actions
  setUsers: (users: User[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedUser: (user: User | null) => void;
  updateSearchParams: (params: Partial<UserListParams>) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  removeUser: (userId: string) => void;
  resetState: () => void;
}

const initialSearchParams: UserListParams = {
  page: 1,
  pageSize: 10,
};

export const useUserStore = create<UserState>()(
  devtools(
    (set) => ({
      // Initial state
      users: [],
      total: 0,
      loading: false,
      error: null,
      selectedUser: null,
      searchParams: initialSearchParams,

      // Actions
      setUsers: (users, total) =>
        set({ users, total, error: null }, false, 'setUsers'),

      setLoading: (loading) =>
        set({ loading }, false, 'setLoading'),

      setError: (error) =>
        set({ error, loading: false }, false, 'setError'),

      setSelectedUser: (selectedUser) =>
        set({ selectedUser }, false, 'setSelectedUser'),

      updateSearchParams: (params) =>
        set(
          (state) => ({
            searchParams: { ...state.searchParams, ...params },
          }),
          false,
          'updateSearchParams'
        ),

      addUser: (user) =>
        set(
          (state) => ({
            users: [user, ...state.users],
            total: state.total + 1,
          }),
          false,
          'addUser'
        ),

      updateUser: (updatedUser) =>
        set(
          (state) => ({
            users: state.users.map((user) =>
              user.id === updatedUser.id ? updatedUser : user
            ),
            selectedUser:
              state.selectedUser?.id === updatedUser.id
                ? updatedUser
                : state.selectedUser,
          }),
          false,
          'updateUser'
        ),

      removeUser: (userId) =>
        set(
          (state) => ({
            users: state.users.filter((user) => user.id !== userId),
            total: state.total - 1,
            selectedUser:
              state.selectedUser?.id === userId ? null : state.selectedUser,
          }),
          false,
          'removeUser'
        ),

      resetState: () =>
        set(
          {
            users: [],
            total: 0,
            loading: false,
            error: null,
            selectedUser: null,
            searchParams: initialSearchParams,
          },
          false,
          'resetState'
        ),
    }),
    {
      name: 'user-store',
    }
  )
); 
