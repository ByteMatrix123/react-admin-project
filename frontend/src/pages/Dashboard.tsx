import React from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Avatar,
  Space,
  Typography,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  ShoppingOutlined,
  DollarOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../stores/appStore';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const { setBreadcrumbs } = useAppStore();

  // 设置面包屑
  React.useEffect(() => {
    setBreadcrumbs([
      { title: '首页', path: '/dashboard' },
      { title: '仪表盘' },
    ]);
  }, [setBreadcrumbs]);

  // 模拟统计数据
  const stats = [
    {
      title: '总用户数',
      value: 1234,
      prefix: <UserOutlined />,
      suffix: '人',
      precision: 0,
      valueStyle: { color: '#3f8600' },
    },
    {
      title: '活跃用户',
      value: 1089,
      prefix: <TeamOutlined />,
      suffix: '人',
      precision: 0,
      valueStyle: { color: '#1890ff' },
    },
    {
      title: '今日订单',
      value: 89,
      prefix: <ShoppingOutlined />,
      suffix: '单',
      precision: 0,
      valueStyle: { color: '#722ed1' },
    },
    {
      title: '销售额',
      value: 112893,
      prefix: <DollarOutlined />,
      suffix: '元',
      precision: 2,
      valueStyle: { color: '#cf1322' },
    },
  ];

  // 模拟最近活动数据
  const recentActivities = [
    {
      id: '1',
      user: '张三',
      action: '创建了新用户',
      target: '李四',
      time: '2分钟前',
      type: 'create',
    },
    {
      id: '2',
      user: '王五',
      action: '更新了用户信息',
      target: '赵六',
      time: '5分钟前',
      type: 'update',
    },
    {
      id: '3',
      user: '钱七',
      action: '删除了用户',
      target: '孙八',
      time: '10分钟前',
      type: 'delete',
    },
    {
      id: '4',
      user: '周九',
      action: '重置了密码',
      target: '吴十',
      time: '15分钟前',
      type: 'reset',
    },
  ];

  const activityColumns = [
    {
      title: '操作者',
      dataIndex: 'user',
      key: 'user',
      render: (text: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {text}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <span>
          {record.action} <Text strong>{record.target}</Text>
        </span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors = {
          create: 'green',
          update: 'blue',
          delete: 'red',
          reset: 'orange',
        };
        const texts = {
          create: '创建',
          update: '更新',
          delete: '删除',
          reset: '重置',
        };
        return (
          <Tag color={colors[type as keyof typeof colors]}>
            {texts[type as keyof typeof texts]}
          </Tag>
        );
      },
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        仪表盘
      </Title>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <Col span={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                precision={stat.precision}
                valueStyle={stat.valueStyle}
                prefix={stat.prefix}
                suffix={stat.suffix}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        {/* 用户增长趋势 */}
        <Col span={12}>
          <Card title="用户增长趋势" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <Text>本月新增用户</Text>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                <Statistic
                  value={234}
                  precision={0}
                  valueStyle={{ color: '#3f8600', fontSize: 24 }}
                  prefix={<ArrowUpOutlined />}
                  suffix="人"
                />
                <Text style={{ marginLeft: 16, color: '#3f8600' }}>
                  较上月增长 12.5%
                </Text>
              </div>
            </div>
            <Progress
              percent={75}
              status="active"
              strokeColor={{
                from: '#108ee9',
                to: '#87d068',
              }}
            />
          </Card>
        </Col>

        {/* 系统状态 */}
        <Col span={12}>
          <Card title="系统状态" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>CPU 使用率</Text>
                <Text>45%</Text>
              </div>
              <Progress percent={45} strokeColor="#52c41a" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>内存使用率</Text>
                <Text>67%</Text>
              </div>
              <Progress percent={67} strokeColor="#1890ff" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>磁盘使用率</Text>
                <Text>23%</Text>
              </div>
              <Progress percent={23} strokeColor="#722ed1" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 最近活动 */}
      <Card title="最近活动">
        <Table
          columns={activityColumns}
          dataSource={recentActivities}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default Dashboard; 
