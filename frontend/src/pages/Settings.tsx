import React, { useState } from 'react';
import {
  Card,
  Form,
  Switch,
  Select,
  Button,
  Row,
  Col,
  Typography,
  Divider,
  Space,
  message,
  Tabs,
  Radio,
  Slider,
  InputNumber,
  Alert,
  List,
  Badge,
  Modal,
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  ClearOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../stores/appStore';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface SystemSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  fontSize: number;
  sidebarCollapsed: boolean;
  autoSave: boolean;
  notifications: {
    email: boolean;
    browser: boolean;
    mobile: boolean;
    system: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    allowDataCollection: boolean;
    shareUsageData: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
    loginNotification: boolean;
  };
}

const Settings: React.FC = () => {
  const { collapsed, toggleCollapsed } = useAppStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  // 默认设置
  const [settings, setSettings] = useState<SystemSettings>({
    theme: 'light',
    language: 'zh-CN',
    fontSize: 14,
    sidebarCollapsed: collapsed,
    autoSave: true,
    notifications: {
      email: true,
      browser: true,
      mobile: false,
      system: true,
    },
    privacy: {
      showOnlineStatus: true,
      allowDataCollection: false,
      shareUsageData: false,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      loginNotification: true,
    },
  });

  // 保存设置
  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSettings({ ...settings, ...values });
      message.success('设置保存成功');
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 重置设置
  const handleReset = () => {
    Modal.confirm({
      title: '确认重置',
      icon: <ExclamationCircleOutlined />,
      content: '确定要重置所有设置到默认值吗？此操作不可撤销。',
      okText: '确认重置',
      cancelText: '取消',
      onOk: () => {
        form.resetFields();
        message.success('设置已重置');
      },
    });
  };

  // 清除缓存
  const handleClearCache = () => {
    Modal.confirm({
      title: '清除缓存',
      icon: <ExclamationCircleOutlined />,
      content: '确定要清除所有缓存数据吗？这可能会影响应用性能。',
      okText: '确认清除',
      cancelText: '取消',
      onOk: () => {
        // 清除localStorage和sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        message.success('缓存已清除');
      },
    });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>
        <SettingOutlined /> 系统设置
      </Title>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={settings}
      >
        <Tabs defaultActiveKey="general">
          {/* 通用设置 */}
          <TabPane tab="通用设置" key="general">
            <Row gutter={24}>
              <Col xs={24} lg={12}>
                <Card title="界面设置" size="small">
                  <Form.Item
                    name="theme"
                    label="主题模式"
                  >
                    <Radio.Group>
                      <Radio.Button value="light">浅色</Radio.Button>
                      <Radio.Button value="dark">深色</Radio.Button>
                      <Radio.Button value="auto">跟随系统</Radio.Button>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    name="language"
                    label="语言设置"
                  >
                    <Select>
                      <Option value="zh-CN">简体中文</Option>
                      <Option value="en-US">English</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="fontSize"
                    label="字体大小"
                  >
                    <Row>
                      <Col span={12}>
                        <Slider
                          min={12}
                          max={18}
                          marks={{
                            12: '小',
                            14: '中',
                            16: '大',
                            18: '特大',
                          }}
                        />
                      </Col>
                      <Col span={4} offset={1}>
                        <InputNumber
                          min={12}
                          max={18}
                          style={{ width: '100%' }}
                        />
                      </Col>
                    </Row>
                  </Form.Item>

                  <Form.Item
                    name="sidebarCollapsed"
                    label="侧边栏"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="收起"
                      unCheckedChildren="展开"
                      onChange={toggleCollapsed}
                    />
                  </Form.Item>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card title="功能设置" size="small">
                  <Form.Item
                    name="autoSave"
                    label="自动保存"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="开启"
                      unCheckedChildren="关闭"
                    />
                  </Form.Item>

                  <div style={{ marginTop: 24 }}>
                    <Text strong>快捷操作</Text>
                    <div style={{ marginTop: 12 }}>
                      <Space>
                        <Button
                          icon={<ClearOutlined />}
                          onClick={handleClearCache}
                        >
                          清除缓存
                        </Button>
                        <Button
                          icon={<ExclamationCircleOutlined />}
                          onClick={handleReset}
                        >
                          重置设置
                        </Button>
                      </Space>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* 通知设置 */}
          <TabPane tab="通知设置" key="notifications">
            <Row gutter={24}>
              <Col xs={24} lg={16}>
                <Card title="通知偏好" size="small">
                  <Form.Item
                    name={['notifications', 'email']}
                    label="邮件通知"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="开启"
                      unCheckedChildren="关闭"
                    />
                  </Form.Item>

                  <Form.Item
                    name={['notifications', 'browser']}
                    label="浏览器通知"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="开启"
                      unCheckedChildren="关闭"
                    />
                  </Form.Item>

                  <Form.Item
                    name={['notifications', 'mobile']}
                    label="手机推送"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="开启"
                      unCheckedChildren="关闭"
                    />
                  </Form.Item>

                  <Form.Item
                    name={['notifications', 'system']}
                    label="系统通知"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="开启"
                      unCheckedChildren="关闭"
                    />
                  </Form.Item>
                </Card>
              </Col>

              <Col xs={24} lg={8}>
                <Card title="通知类型" size="small">
                  <List
                    size="small"
                    dataSource={[
                      { type: '系统更新', enabled: true },
                      { type: '安全警告', enabled: true },
                      { type: '任务提醒', enabled: false },
                      { type: '消息通知', enabled: true },
                    ]}
                    renderItem={(item) => (
                      <List.Item>
                        <Space>
                          <Badge
                            status={item.enabled ? 'success' : 'default'}
                          />
                          <Text>{item.type}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* 隐私设置 */}
          <TabPane tab="隐私设置" key="privacy">
            <Row gutter={24}>
              <Col xs={24} lg={16}>
                <Card title="隐私控制" size="small">
                  <Alert
                    message="隐私保护"
                    description="我们重视您的隐私，以下设置可以帮助您控制个人信息的使用。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />

                  <Form.Item
                    name={['privacy', 'showOnlineStatus']}
                    label="显示在线状态"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="显示"
                      unCheckedChildren="隐藏"
                    />
                  </Form.Item>

                  <Form.Item
                    name={['privacy', 'allowDataCollection']}
                    label="允许数据收集"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="允许"
                      unCheckedChildren="拒绝"
                    />
                  </Form.Item>

                  <Form.Item
                    name={['privacy', 'shareUsageData']}
                    label="分享使用数据"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="分享"
                      unCheckedChildren="不分享"
                    />
                  </Form.Item>

                  <Divider />

                  <Paragraph>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      数据收集说明：我们可能会收集您的使用数据以改善产品体验，
                      包括但不限于页面访问记录、功能使用情况等。
                      您可以随时关闭此功能。
                    </Text>
                  </Paragraph>
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* 安全设置 */}
          <TabPane tab="安全设置" key="security">
            <Row gutter={24}>
              <Col xs={24} lg={16}>
                <Card title="账户安全" size="small">
                  <Alert
                    message="安全提醒"
                    description="为了保护您的账户安全，建议开启以下安全功能。"
                    type="warning"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />

                  <Form.Item
                    name={['security', 'twoFactorAuth']}
                    label="双因素认证"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="开启"
                      unCheckedChildren="关闭"
                    />
                  </Form.Item>

                  <Form.Item
                    name={['security', 'loginNotification']}
                    label="登录通知"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="开启"
                      unCheckedChildren="关闭"
                    />
                  </Form.Item>

                  <Form.Item
                    name={['security', 'sessionTimeout']}
                    label="会话超时时间（分钟）"
                  >
                    <Select>
                      <Option value={15}>15分钟</Option>
                      <Option value={30}>30分钟</Option>
                      <Option value={60}>1小时</Option>
                      <Option value={120}>2小时</Option>
                      <Option value={480}>8小时</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name={['security', 'passwordExpiry']}
                    label="密码过期时间（天）"
                  >
                    <Select>
                      <Option value={30}>30天</Option>
                      <Option value={60}>60天</Option>
                      <Option value={90}>90天</Option>
                      <Option value={180}>180天</Option>
                      <Option value={0}>永不过期</Option>
                    </Select>
                  </Form.Item>
                </Card>
              </Col>

              <Col xs={24} lg={8}>
                <Card title="安全状态" size="small">
                  <List
                    size="small"
                    dataSource={[
                      { 
                        title: '密码强度', 
                        status: 'success', 
                        desc: '强' 
                      },
                      { 
                        title: '双因素认证', 
                        status: 'warning', 
                        desc: '未开启' 
                      },
                      { 
                        title: '最近登录', 
                        status: 'success', 
                        desc: '2小时前' 
                      },
                      { 
                        title: '异常登录', 
                        status: 'success', 
                        desc: '无' 
                      },
                    ]}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Badge
                              status={item.status as any}
                            />
                          }
                          title={item.title}
                          description={item.desc}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Space size="large">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
              size="large"
            >
              保存设置
            </Button>
            <Button
              onClick={handleReset}
              icon={<ClearOutlined />}
              size="large"
            >
              重置设置
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default Settings; 
