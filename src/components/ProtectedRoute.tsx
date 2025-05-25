import React from 'react';
import { Navigate } from '@tanstack/react-router';
import { Spin } from 'antd';
import { useAuthStore } from '../stores/authStore';
import { useCurrentUser } from '../hooks/useAuthQuery';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallback,
}) => {
  const { 
    token, 
    user, 
    hasPermission, 
    hasRole,
    checkAuthenticated 
  } = useAuthStore();

  // 获取当前用户信息
  const { isLoading: userLoading } = useCurrentUser();

  // 如果正在加载用户信息，显示加载状态
  if (userLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  // 检查是否已认证
  if (!checkAuthenticated() || !token || !user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to="/login" replace />;
  }

  // 检查用户状态
  if (!user.is_active) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
      }}>
        <h2>账户已被禁用</h2>
        <p>您的账户已被管理员禁用，请联系管理员处理。</p>
      </div>
    );
  }

  if (!user.is_verified) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
      }}>
        <h2>账户待审核</h2>
        <p>您的账户正在等待管理员审核，请耐心等待。</p>
      </div>
    );
  }

  // 检查权限
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every(permission =>
      hasPermission(permission)
    );
    
    if (!hasRequiredPermissions) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
        }}>
          <h2>权限不足</h2>
          <p>您没有访问此页面的权限。</p>
        </div>
      );
    }
  }

  // 检查角色
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    
    if (!hasRequiredRole) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
        }}>
          <h2>角色权限不足</h2>
          <p>您的角色无法访问此页面。</p>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute; 
