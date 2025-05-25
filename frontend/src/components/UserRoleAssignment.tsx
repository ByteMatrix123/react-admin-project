import React, { useState } from 'react';
import {
  Modal,
  Form,
  Select,
  Button,
  Space,
  Tag,
  Alert,
  Divider,
  Typography,
  List,
  Avatar,

} from 'antd';
import {
  UserOutlined,
  SafetyOutlined,

  CheckCircleOutlined,
} from '@ant-design/icons';
import { useRoles } from '../hooks/useRoleQuery';
import type { User } from '../types/user';
import type { Role } from '../types/auth';

const { Text, Title } = Typography;
const { Option } = Select;

interface UserRoleAssignmentProps {
  visible: boolean;
  user: User | null;
  onCancel: () => void;
  onSubmit: (userId: number, roleIds: number[]) => Promise<void>;
  loading?: boolean;
}

const UserRoleAssignment: React.FC<UserRoleAssignmentProps> = ({
  visible,
  user,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const { data: roles } = useRoles();
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);

  // 处理角色选择
  const handleRoleChange = (roleIds: (string | number)[]) => {
    const numericRoleIds = roleIds.map(id => typeof id === 'string' ? parseInt(id) : id);
    const selected = roles?.filter(role => numericRoleIds.includes(role.id)) || [];
    setSelectedRoles(selected);
  };

  // 提交表单
  const handleSubmit = async (values: { roleIds: (string | number)[] }) => {
    if (!user) return;
    
    try {
      const numericRoleIds = values.roleIds.map(id => typeof id === 'string' ? parseInt(id) : id);
      await onSubmit(user.id, numericRoleIds);
      form.resetFields();
      setSelectedRoles([]);
    } catch (error) {
      // 错误处理已在父组件完成
    }
  };

  // 获取角色级别颜色
  const getRoleLevelColor = (level: number) => {
    if (level >= 80) return 'red';
    if (level >= 60) return 'orange';
    if (level >= 40) return 'blue';
    return 'green';
  };

  // 获取当前用户角色
  const getCurrentUserRoles = () => {
    if (!user || !roles) return [];
    return user.roles || [];
  };

  const currentRoles = getCurrentUserRoles();

  return (
    <Modal
      title={
        <Space>
          <UserOutlined />
          <span>为用户 "{user?.full_name}" 分配角色</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      {user && (
        <>
          {/* 用户信息 */}
          <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f6f8fa', borderRadius: 8 }}>
            <Space>
              <Avatar size={48} src={user.avatar_url} icon={<UserOutlined />} />
              <div>
                <Title level={5} style={{ margin: 0 }}>{user.full_name}</Title>
                <Text type="secondary">{user.email}</Text>
                <br />
                <Text type="secondary">{user.department} - {user.position}</Text>
              </div>
            </Space>
          </div>

          {/* 当前角色 */}
          {currentRoles.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Title level={5}>当前角色</Title>
              <Space wrap>
                {currentRoles.map(role => (
                  <Tag
                    key={role.id}
                    color={getRoleLevelColor(role.level)}
                    icon={<SafetyOutlined />}
                  >
                    {role.name} (级别: {role.level})
                  </Tag>
                ))}
              </Space>
            </div>
          )}

          <Divider />

          {/* 角色分配表单 */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              roleIds: currentRoles.map(role => role.id),
            }}
          >
            <Form.Item
              name="roleIds"
              label="选择角色"
              rules={[{ required: true, message: '请至少选择一个角色' }]}
            >
              <Select
                mode="multiple"
                placeholder="请选择角色"
                onChange={handleRoleChange}
                style={{ width: '100%' }}
              >
                {roles?.map(role => (
                  <Option key={role.id} value={role.id} disabled={!role.is_active}>
                    <Space>
                      <Tag color={getRoleLevelColor(role.level)}>
                        {role.level}
                      </Tag>
                      <span>{role.display_name}</span>
                      {role.is_system && <Tag color="blue">系统</Tag>}
                      {!role.is_active && <Tag color="red">禁用</Tag>}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* 选中角色预览 */}
            {selectedRoles.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Title level={5}>选中的角色</Title>
                <List
                  size="small"
                  dataSource={selectedRoles}
                  renderItem={(role) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Tag color={getRoleLevelColor(role.level)}>
                            {role.level}
                          </Tag>
                        }
                        title={
                          <Space>
                            <Text strong>{role.display_name}</Text>
                            {role.is_system && <Tag color="blue">系统</Tag>}
                          </Space>
                        }
                        description={
                          <div>
                            <Text type="secondary">{role.description}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              角色代码: {role.name}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            <Alert
              message="角色分配说明"
              description={
                <div>
                  <p>• 用户可以拥有多个角色，系统会合并所有角色的权限</p>
                  <p>• 权限级别高的角色会覆盖级别低的角色权限</p>
                  <p>• 系统角色具有预定义权限，不建议随意分配</p>
                  <p>• 角色变更会立即生效，用户需要重新登录</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={onCancel}>
                  取消
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<CheckCircleOutlined />}
                >
                  保存分配
                </Button>
              </Space>
            </div>
          </Form>
        </>
      )}
    </Modal>
  );
};

export default UserRoleAssignment; 
