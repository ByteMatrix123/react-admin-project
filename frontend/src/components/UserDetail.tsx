import React from 'react';
import {
  Descriptions,
  Avatar,
  Tag,
  Button,
  Space,
  Card,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { User } from '../types/user';



interface UserDetailProps {
  user: User;
  onEdit?: () => void;
  onDelete?: () => void;
}

// 角色颜色映射
const roleColors = {
  admin: 'red',
  manager: 'blue',
  user: 'green',
};

// 角色文本映射
const roleTexts = {
  admin: '管理员',
  manager: '经理',
  user: '普通用户',
};

// 状态颜色映射
const statusColors = {
  active: 'green',
  inactive: 'red',
  pending: 'orange',
};

// 状态文本映射
const statusTexts = {
  active: '正常',
  inactive: '已禁用',
  pending: '待审核',
};

const UserDetail: React.FC<UserDetailProps> = ({ user, onEdit, onDelete }) => {
  // 获取用户状态
  const getUserStatus = () => {
    if (!user.is_active) return 'inactive';
    if (!user.is_verified) return 'pending';
    return 'active';
  };

  // 获取主要角色
  const getPrimaryRole = () => {
    if (user.is_superuser) return 'admin';
    if (user.roles.length > 0) {
      // 返回级别最高的角色
      const sortedRoles = user.roles.sort((a, b) => a.level - b.level);
      return sortedRoles[0].name;
    }
    return 'user';
  };

  // 获取用户权限
  const getUserPermissions = (): string[] => {
    if (user.is_superuser) return ['*'];
    
    // 从角色中提取权限
    const permissions: string[] = [];
    user.roles.forEach(role => {
      // 这里可以根据角色映射权限，暂时使用基础权限
      if (role.name === 'admin') {
        permissions.push('*');
      } else if (role.name === 'manager') {
        permissions.push('user:read', 'user:create', 'user:update');
      } else {
        permissions.push('user:read', 'profile:update');
      }
    });
    
    return [...new Set(permissions)]; // 去重
  };

  const userStatus = getUserStatus();
  const primaryRole = getPrimaryRole();
  const userPermissions = getUserPermissions();

  return (
    <Card
      title={
        <Space>
          <Avatar
            size={80}
            src={user.avatar_url}
            icon={<UserOutlined />}
            style={{ marginBottom: 16 }}
          />
          <div>
            {user.full_name}
            <div style={{ fontSize: 14, fontWeight: 'normal', color: '#666' }}>
              <Tag color={roleColors[primaryRole as keyof typeof roleColors]}>
                {roleTexts[primaryRole as keyof typeof roleTexts]}
              </Tag>
              <Tag color={statusColors[userStatus as keyof typeof statusColors]}>
                {statusTexts[userStatus as keyof typeof statusTexts]}
              </Tag>
            </div>
          </div>
        </Space>
      }
      extra={
        <Space>
          {onEdit && (
            <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
              编辑
            </Button>
          )}
          {onDelete && (
            <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
              删除
            </Button>
          )}
        </Space>
      }
    >
      <Descriptions column={2} bordered>
        <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
        <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
        <Descriptions.Item label="手机号">{user.phone}</Descriptions.Item>
        <Descriptions.Item label="部门">{user.department}</Descriptions.Item>
        <Descriptions.Item label="职位">{user.position}</Descriptions.Item>
        <Descriptions.Item label="工作地点">{user.work_location || '-'}</Descriptions.Item>
        <Descriptions.Item label="生日">{user.birthday || '-'}</Descriptions.Item>
        <Descriptions.Item label="个人简介" span={2}>
          {user.bio || '-'}
        </Descriptions.Item>
      </Descriptions>

      <Card title="角色信息" style={{ marginTop: 16 }}>
        <Space wrap>
          {user.roles.map(role => (
            <Tag key={role.id} color="blue">
              {role.display_name}
            </Tag>
          ))}
        </Space>
      </Card>

      <Card title="权限信息" style={{ marginTop: 16 }}>
        <Space wrap>
          {userPermissions.map(permission => (
            <Tag key={permission} color="green">
              {permission}
            </Tag>
          ))}
        </Space>
      </Card>

      <Card title="系统信息" style={{ marginTop: 16 }}>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="创建时间">
            {dayjs(user.created_at).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {dayjs(user.updated_at).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="最后登录">
            {user.last_login_at
              ? dayjs(user.last_login_at).format('YYYY-MM-DD HH:mm:ss')
              : '从未登录'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Card>
  );
};

export default UserDetail; 
