import React from 'react';
import {
  Descriptions,
  Avatar,
  Tag,
  Button,
  Space,
  Card,
  Typography,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { User } from '../types/user';

const { Title, Text } = Typography;

interface UserDetailProps {
  user: User;
  onEdit?: () => void;
}

const UserDetail: React.FC<UserDetailProps> = ({ user, onEdit }) => {
  // 状态标签颜色映射
  const statusColors = {
    active: 'green',
    inactive: 'red',
    pending: 'orange',
  };

  // 状态文本映射
  const statusTexts = {
    active: '正常',
    inactive: '禁用',
    pending: '待审核',
  };

  // 角色文本映射
  const roleTexts = {
    admin: '管理员',
    manager: '经理',
    user: '普通用户',
  };

  // 角色颜色映射
  const roleColors = {
    admin: 'red',
    manager: 'blue',
    user: 'default',
  };

  return (
    <div>
      {/* 用户基本信息卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar
            size={80}
            src={user.avatar}
            icon={<UserOutlined />}
            style={{ marginBottom: 16 }}
          />
          <Title level={4} style={{ margin: 0 }}>
            {user.realName}
          </Title>
          <Text type="secondary">@{user.username}</Text>
          <div style={{ marginTop: 8 }}>
            <Space>
              <Tag color={roleColors[user.role as keyof typeof roleColors]}>
                {roleTexts[user.role as keyof typeof roleTexts]}
              </Tag>
              <Tag color={statusColors[user.status as keyof typeof statusColors]}>
                {statusTexts[user.status as keyof typeof statusTexts]}
              </Tag>
            </Space>
          </div>
        </div>

        {onEdit && (
          <div style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={onEdit}
            >
              编辑用户
            </Button>
          </div>
        )}
      </Card>

      {/* 详细信息 */}
      <Card title="基本信息">
        <Descriptions column={1} labelStyle={{ width: 100 }}>
          <Descriptions.Item
            label={<><MailOutlined /> 邮箱</>}
          >
            {user.email}
          </Descriptions.Item>
          <Descriptions.Item
            label={<><PhoneOutlined /> 手机号</>}
          >
            {user.phone || '-'}
          </Descriptions.Item>
          <Descriptions.Item
            label={<><TeamOutlined /> 部门</>}
          >
            {user.department}
          </Descriptions.Item>
          <Descriptions.Item label="职位">
            {user.position}
          </Descriptions.Item>
          <Descriptions.Item label="用户ID">
            <Text code>{user.id}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 权限信息 */}
      <Card title="权限信息" style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Text strong>拥有权限：</Text>
        </div>
        <Space wrap>
          {user.permissions.map(permission => (
            <Tag key={permission} color="blue">
              {permission}
            </Tag>
          ))}
        </Space>
      </Card>

      {/* 时间信息 */}
      <Card title="时间信息" style={{ marginTop: 16 }}>
        <Descriptions column={1} labelStyle={{ width: 100 }}>
          <Descriptions.Item
            label={<><ClockCircleOutlined /> 创建时间</>}
          >
            {dayjs(user.createdAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item
            label={<><ClockCircleOutlined /> 更新时间</>}
          >
            {dayjs(user.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item
            label={<><ClockCircleOutlined /> 最后登录</>}
          >
            {user.lastLoginAt 
              ? dayjs(user.lastLoginAt).format('YYYY-MM-DD HH:mm:ss')
              : '从未登录'
            }
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default UserDetail; 
