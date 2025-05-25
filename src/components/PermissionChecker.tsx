import React from 'react';
import { Result, Button } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';


interface PermissionCheckerProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallback?: React.ReactNode;
  mode?: 'all' | 'any'; // all: 需要所有权限, any: 需要任一权限
}

const PermissionChecker: React.FC<PermissionCheckerProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallback,
  mode = 'all',
}) => {
  const { user, hasPermission, hasRole } = useAuthStore();

  if (!user) {
    return fallback || (
      <Result
        status="403"
        title="未登录"
        subTitle="请先登录系统"
        extra={<Button type="primary">去登录</Button>}
      />
    );
  }

  // 检查角色权限
  const hasRequiredRole = requiredRoles.length === 0 || 
    (mode === 'all' 
      ? requiredRoles.every(role => hasRole(role))
      : requiredRoles.some(role => hasRole(role))
    );

  // 检查具体权限
  const hasRequiredPermission = requiredPermissions.length === 0 ||
    (mode === 'all'
      ? requiredPermissions.every(permission => hasPermission(permission))
      : requiredPermissions.some(permission => hasPermission(permission))
    );

  const hasAccess = hasRequiredRole && hasRequiredPermission;

  if (!hasAccess) {
    return fallback || (
      <Result
        status="403"
        title="权限不足"
        subTitle="您没有访问此功能的权限，请联系管理员"
        icon={<ExclamationCircleOutlined />}
        extra={
          <div>
            {requiredRoles.length > 0 && (
              <p>需要角色：{requiredRoles.join(', ')}</p>
            )}
            {requiredPermissions.length > 0 && (
              <p>需要权限：{requiredPermissions.join(', ')}</p>
            )}
          </div>
        }
      />
    );
  }

  return <>{children}</>;
};

export default PermissionChecker; 
