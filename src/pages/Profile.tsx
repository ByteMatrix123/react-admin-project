import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  Row,
  Col,
  Divider,
  Typography,
  Space,
  message,
  Tabs,
  Select,
  DatePicker,

} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  CameraOutlined,
  SaveOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { useChangePassword } from '../hooks/useAuthQuery';
import { departments } from '../services/mockData';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface ProfileFormData {
  realName: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  bio?: string;
  birthday?: string;
  location?: string;
}

interface PasswordFormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar);
  
  const changePasswordMutation = useChangePassword();

  // 处理头像上传
  const handleAvatarChange = (info: any) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      // 模拟头像上传成功
      const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;
      setAvatarUrl(newAvatarUrl);
      setLoading(false);
      message.success('头像上传成功');
    }
  };

  // 上传前的验证
  const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG 格式的图片!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB!');
    }
    return isJpgOrPng && isLt2M;
  };

  // 保存个人资料
  const handleProfileSubmit = async (values: ProfileFormData) => {
    try {
      setLoading(true);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 更新用户信息
      if (user) {
        const updatedUser = {
          ...user,
          realName: values.realName,
          email: values.email,
          phone: values.phone,
          department: values.department,
          position: values.position,
          avatar: avatarUrl,
        };
        setUser(updatedUser);
      }
      
      message.success('个人资料更新成功');
    } catch (error) {
      message.error('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handlePasswordSubmit = async (values: PasswordFormData) => {
    try {
      await changePasswordMutation.mutateAsync(values);
      passwordForm.resetFields();
    } catch (error) {
      // 错误处理已在mutation中完成
    }
  };

  if (!user) {
    return <div>用户信息加载中...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>个人资料</Title>
      
      <Row gutter={24}>
        <Col xs={24} lg={8}>
          {/* 头像和基本信息卡片 */}
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  size={120}
                  src={avatarUrl}
                  icon={<UserOutlined />}
                  style={{ marginBottom: 16 }}
                />
                <Upload
                  name="avatar"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  onChange={handleAvatarChange}
                  customRequest={({ onSuccess }) => {
                    // 模拟上传成功
                    setTimeout(() => {
                      onSuccess?.({}, {} as XMLHttpRequest);
                    }, 1000);
                  }}
                >
                  <Button
                    icon={<CameraOutlined />}
                    shape="circle"
                    size="small"
                    style={{
                      position: 'absolute',
                      bottom: 16,
                      right: 0,
                      backgroundColor: '#fff',
                      border: '1px solid #d9d9d9',
                    }}
                  />
                </Upload>
              </div>
              
              <Title level={4} style={{ margin: '8px 0' }}>
                {user.realName}
              </Title>
              <Text type="secondary">{user.position}</Text>
              <br />
              <Text type="secondary">{user.department}</Text>
              
              <Divider />
              
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>用户名：</Text>
                  <Text>{user.username}</Text>
                </div>
                <div>
                  <Text strong>角色：</Text>
                  <Text>
                    {user.role === 'admin' ? '管理员' : 
                     user.role === 'manager' ? '经理' : '普通用户'}
                  </Text>
                </div>
                <div>
                  <Text strong>状态：</Text>
                  <Text style={{ 
                    color: user.status === 'active' ? '#52c41a' : 
                           user.status === 'pending' ? '#faad14' : '#ff4d4f' 
                  }}>
                    {user.status === 'active' ? '正常' : 
                     user.status === 'pending' ? '待审核' : '已禁用'}
                  </Text>
                </div>
              </Space>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={16}>
          <Card>
            <Tabs defaultActiveKey="profile">
              <TabPane tab="基本信息" key="profile">
                <Form
                  form={profileForm}
                  layout="vertical"
                  onFinish={handleProfileSubmit}
                  initialValues={{
                    realName: user.realName,
                    email: user.email,
                    phone: user.phone,
                    department: user.department,
                    position: user.position,
                  }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="realName"
                        label="真实姓名"
                        rules={[
                          { required: true, message: '请输入真实姓名' },
                          { max: 50, message: '姓名长度不能超过50个字符' },
                        ]}
                      >
                        <Input prefix={<UserOutlined />} placeholder="请输入真实姓名" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="email"
                        label="邮箱地址"
                        rules={[
                          { required: true, message: '请输入邮箱地址' },
                          { type: 'email', message: '请输入有效的邮箱地址' },
                        ]}
                      >
                        <Input prefix={<MailOutlined />} placeholder="请输入邮箱地址" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="phone"
                        label="手机号码"
                        rules={[
                          { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                        ]}
                      >
                        <Input prefix={<PhoneOutlined />} placeholder="请输入手机号码" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="department"
                        label="所属部门"
                        rules={[{ required: true, message: '请选择所属部门' }]}
                      >
                        <Select placeholder="请选择所属部门">
                          {departments.map(dept => (
                            <Option key={dept} value={dept}>{dept}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
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
                    <Col span={12}>
                      <Form.Item
                        name="location"
                        label="工作地点"
                      >
                        <Input placeholder="请输入工作地点" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="birthday"
                    label="生日"
                  >
                    <DatePicker 
                      style={{ width: '100%' }} 
                      placeholder="请选择生日"
                      disabledDate={(current) => current && current > dayjs().endOf('day')}
                    />
                  </Form.Item>

                  <Form.Item
                    name="bio"
                    label="个人简介"
                  >
                    <Input.TextArea 
                      rows={4} 
                      placeholder="请输入个人简介"
                      maxLength={200}
                      showCount
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<SaveOutlined />}
                    >
                      保存更改
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>

              <TabPane tab="修改密码" key="password">
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordSubmit}
                  style={{ maxWidth: 400 }}
                >
                  <Form.Item
                    name="oldPassword"
                    label="当前密码"
                    rules={[{ required: true, message: '请输入当前密码' }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请输入当前密码"
                      iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    />
                  </Form.Item>

                  <Form.Item
                    name="newPassword"
                    label="新密码"
                    rules={[
                      { required: true, message: '请输入新密码' },
                      { min: 6, message: '密码长度至少6个字符' },
                      { pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, message: '密码必须包含字母和数字' },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请输入新密码"
                      iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    label="确认新密码"
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: '请确认新密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('两次输入的密码不一致'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请再次输入新密码"
                      iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={changePasswordMutation.isPending}
                      icon={<SaveOutlined />}
                    >
                      修改密码
                    </Button>
                  </Form.Item>
                </Form>

                <div style={{ 
                  marginTop: 24, 
                  padding: 16, 
                  backgroundColor: '#f6f8fa', 
                  borderRadius: 8 
                }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <strong>密码安全提示：</strong><br />
                    1. 密码长度至少6个字符<br />
                    2. 必须包含字母和数字<br />
                    3. 建议定期更换密码<br />
                    4. 不要使用过于简单的密码
                  </Text>
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile; 
