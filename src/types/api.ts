// 基础API响应类型
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

// 分页响应类型
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

// 错误响应类型
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

// 分页查询参数
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

// 排序参数
export interface SortParams {
  sort?: string;
  order?: 'asc' | 'desc';
}

// 搜索参数
export interface SearchParams {
  search?: string;
}

// 通用查询参数
export interface QueryParams extends PaginationParams, SortParams, SearchParams {
  [key: string]: any;
} 
