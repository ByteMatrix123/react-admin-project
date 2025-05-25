import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Space,
  Divider,
} from 'antd';
import { useCreateUser, useUpdateUser } from '../hooks/useUserQuery';
import { departments } from '../services/mockData';
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
        full_name: user.full_name,
        department: user.department,
        position: user.position,
        roles: user.roles.map(role => role.id),
        is_active: user.is_active,
        is_verified: user.is_verified,
      });
    } else {
      form.resetFields();
    }
  }, [user, form]);

  const handleSubmit = async (values: any) => {
    try {
      if (isEditing && user) {
        const updateData: UpdateUserRequest = values;
        await updateUserMutation.mutateAsync({ id: user.id, userData: updateData });
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
        roles: [3],
        is_active: true,
        is_verified: false,
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
            name="full_name"
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
            name="roles"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select mode="multiple" placeholder="请选择角色">
              <Option value={1}>管理员</Option>
              <Option value={2}>经理</Option>
              <Option value={3}>普通用户</Option>
            </Select>
          </Form.Item>
        </Col>
        {isEditing && (
          <Col span={12}>
            <Form.Item
              name="is_active"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                <Option value={true}>正常</Option>
                <Option value={false}>禁用</Option>
              </Select>
            </Form.Item>
          </Col>
        )}
      </Row>

      <Divider orientation="left">权限设置</Divider>
      
      <Form.Item
        name="is_verified"
        label="邮箱验证状态"
      >
        <Select placeholder="请选择验证状态">
          <Option value={true}>已验证</Option>
          <Option value={false}>未验证</Option>
        </Select>
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
