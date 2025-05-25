export interface LoginRequest {
  username: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  department?: string;
  position?: string;
}

export interface AuthUser {
  // Basic Information
  id: number;
  username: string;
  email: string;
  
  // Profile Information
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  
  // Work Information
  department?: string;
  position?: string;
  employee_id?: string;
  
  // Personal Information
  birthday?: string;
  location?: string;
  bio?: string;
  
  // Status and Settings
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  
  // Authentication
  last_login?: string;
  password_changed_at?: string;
  
  // Settings
  language: string;
  timezone: string;
  theme: string;
  
  // Notification Settings
  email_notifications: boolean;
  browser_notifications: boolean;
  mobile_notifications: boolean;
  
  // Privacy Settings
  show_online_status: boolean;
  allow_data_collection: boolean;
  
  // Security Settings
  two_factor_enabled: boolean;
  session_timeout: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relationships
  roles: Role[];
  permissions: string[];
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordChangeRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  level: number;
  is_system: boolean;
  is_active: boolean;
  assigned_at?: string;
  assigned_by?: {
    id: number;
    username: string;
  };
  expires_at?: string;
}

export interface RegisterResponse {
  user_id: number;
  verification_required: boolean;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
  confirm_password: string;
} 
