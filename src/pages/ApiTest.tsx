import React, { useState } from 'react';
import { Card, Button, Input, Form, Space, Typography, Alert, Divider } from 'antd';
import { authService } from '../services/authService';

const { Title, Text } = Typography;

const ApiTest: React.FC = () => {
  const [loginResult, setLoginResult] = useState<any>(null);
  const [userResult, setUserResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const testLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const result = await authService.login(values);
      setLoginResult(result);
      console.log('Login result:', result);
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testGetCurrentUser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setUserResult({ success: false, message: '请先登录' });
        return;
      }
      const result = await authService.getCurrentUser(token);
      setUserResult(result);
      console.log('User result:', result);
    } catch (error: any) {
      console.error('User error:', error);
      setUserResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testLogout = async () => {
    setLoading(true);
    try {
      const result = await authService.logout();
      console.log('Logout result:', result);
      setLoginResult(null);
      setUserResult(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>API 连接测试</Title>
      
      <Card title="登录测试" style={{ marginBottom: '20px' }}>
        <Form
          form={form}
          onFinish={testLogin}
          layout="inline"
          initialValues={{ username: 'admin', password: 'Admin123!' }}
        >
          <Form.Item name="username" rules={[{ required: true }]}>
            <Input placeholder="用户名" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true }]}>
            <Input.Password placeholder="密码" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              测试登录
            </Button>
          </Form.Item>
        </Form>
        
        {loginResult && (
          <div style={{ marginTop: '16px' }}>
            <Alert
              type={loginResult.success ? 'success' : 'error'}
              message={loginResult.success ? '登录成功' : '登录失败'}
              description={
                <div>
                  <Text>消息: {loginResult.message}</Text>
                  {loginResult.success && loginResult.data && (
                    <div style={{ marginTop: '8px' }}>
                      <Text>用户: {loginResult.data.user.username}</Text><br />
                      <Text>角色: {loginResult.data.user.role}</Text><br />
                      <Text>Token: {loginResult.data.token.substring(0, 50)}...</Text>
                    </div>
                  )}
                </div>
              }
            />
          </div>
        )}
      </Card>

      <Card title="用户信息测试" style={{ marginBottom: '20px' }}>
        <Space>
          <Button onClick={testGetCurrentUser} loading={loading}>
            获取当前用户信息
          </Button>
          <Button onClick={testLogout} loading={loading}>
            登出
          </Button>
        </Space>
        
        {userResult && (
          <div style={{ marginTop: '16px' }}>
            <Alert
              type={userResult.success ? 'success' : 'error'}
              message={userResult.success ? '获取成功' : '获取失败'}
              description={
                <div>
                  <Text>消息: {userResult.message}</Text>
                  {userResult.success && userResult.data && (
                    <div style={{ marginTop: '8px' }}>
                      <Text>ID: {userResult.data.id}</Text><br />
                      <Text>用户名: {userResult.data.username}</Text><br />
                      <Text>邮箱: {userResult.data.email}</Text><br />
                      <Text>真实姓名: {userResult.data.realName}</Text><br />
                      <Text>部门: {userResult.data.department}</Text><br />
                      <Text>角色: {userResult.data.role}</Text><br />
                      <Text>状态: {userResult.data.status}</Text><br />
                      <Text>权限: {userResult.data.permissions.join(', ')}</Text>
                    </div>
                  )}
                </div>
              }
            />
          </div>
        )}
      </Card>

      <Card title="Token 信息">
        <div>
          <Text strong>Access Token:</Text><br />
          <Text code>{localStorage.getItem('access_token') || '未登录'}</Text>
        </div>
        <Divider />
        <div>
          <Text strong>Refresh Token:</Text><br />
          <Text code>{localStorage.getItem('refresh_token') || '未登录'}</Text>
        </div>
      </Card>
    </div>
  );
};

export default ApiTest; 
