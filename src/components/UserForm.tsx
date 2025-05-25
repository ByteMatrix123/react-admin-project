import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Space,
  Checkbox,
  Divider,
} from 'antd';
import { useCreateUser, useUpdateUser } from '../hooks/useUserQuery';
import { departments, permissions } from '../services/mockData';
import type { User, CreateUserRequest, UpdateUserRequest } from '../types/user';

const { Option } = Select;

interface UserFormProps {
  user?: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        phone: user.phone,
        realName: user.realName,
        department: user.department,
        position: user.position,
        role: user.role,
        status: user.status,
        permissions: user.permissions,
      });
    } else {
      form.resetFields();
    }
  }, [user, form]);

  const handleSubmit = async (values: any) => {
    try {
      if (isEditing && user) {
        const updateData: UpdateUserRequest = {
          id: user.id,
          ...values,
        };
        await updateUserMutation.mutateAsync(updateData);
      } else {
        const createData: CreateUserRequest = values;
        await createUserMutation.mutateAsync(createData);
      }
      onSuccess();
    } catch (error) {
      // 错误处理已在 mutation 中完成
    }
  };

  const isLoading = createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        role: 'user',
        status: 'pending',
        permissions: ['user:read', 'profile:update'],
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, max: 20, message: '用户名长度为3-20个字符' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' },
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="realName"
            label="真实姓名"
            rules={[
              { required: true, message: '请输入真实姓名' },
              { max: 50, message: '姓名长度不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="department"
            label="部门"
            rules={[{ required: true, message: '请选择部门' }]}
          >
            <Select placeholder="请选择部门">
              {departments.map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="position"
            label="职位"
            rules={[
              { required: true, message: '请输入职位' },
              { max: 50, message: '职位长度不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入职位" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="admin">管理员</Option>
              <Option value="manager">经理</Option>
              <Option value="user">普通用户</Option>
            </Select>
          </Form.Item>
        </Col>
        {isEditing && (
          <Col span={12}>
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                <Option value="active">正常</Option>
                <Option value="inactive">禁用</Option>
                <Option value="pending">待审核</Option>
              </Select>
            </Form.Item>
          </Col>
        )}
      </Row>

      <Divider orientation="left">权限设置</Divider>
      
      <Form.Item
        name="permissions"
        label="权限"
        rules={[{ required: true, message: '请选择至少一个权限' }]}
      >
        <Checkbox.Group style={{ width: '100%' }}>
          <Row gutter={[16, 8]}>
            {permissions.map(permission => (
              <Col span={8} key={permission.key}>
                <Checkbox value={permission.key}>
                  {permission.label}
                </Checkbox>
              </Col>
            ))}
          </Row>
        </Checkbox.Group>
      </Form.Item>

      <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
          >
            {isEditing ? '更新' : '创建'}
          </Button>
          <Button onClick={onCancel}>
            取消
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default UserForm; 
