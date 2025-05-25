import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,

  InputNumber,
  Switch,
  Tree,
  Tabs,
  Row,
  Col,
  Statistic,
  Timeline,
  Tooltip,
  Popconfirm,
  Badge,
  Typography,
  Divider,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
  TeamOutlined,
  KeyOutlined,
  HistoryOutlined,

  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  useRoles,
  usePermissions,
  usePermissionStats,
  useAuditLogs,
  usePermissionTree,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useAssignRolePermissions,
} from '../hooks/usePermissionQuery';
import type { Role, Permission } from '../types/permission';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const PermissionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('roles');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [isPermissionModalVisible, setIsPermissionModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();
  const [permissionForm] = Form.useForm();

  // Queries
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: permissions, isLoading: permissionsLoading } = usePermissions();
  const { data: stats } = usePermissionStats();
  const { data: auditLogs } = useAuditLogs();
  const { data: permissionTree } = usePermissionTree();

  // Mutations
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const assignPermissionsMutation = useAssignRolePermissions();

  // 角色表格列定义
  const roleColumns: ColumnsType<Role> = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Text strong>{text}</Text>
          {record.isSystem && <Tag color="blue">系统</Tag>}
          {!record.isActive && <Tag color="red">禁用</Tag>}
        </Space>
      ),
    },
    {
      title: '角色代码',
      dataIndex: 'code',
      key: 'code',
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '权限级别',
      dataIndex: 'level',
      key: 'level',
      render: (level) => (
        <Tag color={level >= 80 ? 'red' : level >= 60 ? 'orange' : level >= 40 ? 'blue' : 'green'}>
          {level}
        </Tag>
      ),
      sorter: (a, b) => a.level - b.level,
    },
    {
      title: '用户数量',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count) => (
        <Badge count={count} showZero color="#52c41a" />
      ),
    },
    {
      title: '权限数量',
      key: 'permissionCount',
      render: (_, record) => (
        <Text>{record.permissions.length}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'error'} icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑角色">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditRole(record)}
            />
          </Tooltip>
          <Tooltip title="分配权限">
            <Button
              type="text"
              icon={<KeyOutlined />}
              onClick={() => handleAssignPermissions(record)}
            />
          </Tooltip>
          {!record.isSystem && (
            <Popconfirm
              title="确定删除这个角色吗？"
              description="删除后无法恢复，请确认操作。"
              onConfirm={() => handleDeleteRole(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="删除角色">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // 权限表格列定义
  const permissionColumns: ColumnsType<Permission> = [
    {
      title: '权限名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '权限代码',
      dataIndex: 'code',
      key: 'code',
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: '资源',
      dataIndex: 'resource',
      key: 'resource',
      render: (resource) => <Tag>{resource}</Tag>,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (action) => <Tag color="blue">{action}</Tag>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category) => <Tag color="green">{category}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'isSystem',
      key: 'isSystem',
      render: (isSystem) => (
        <Tag color={isSystem ? 'blue' : 'orange'}>
          {isSystem ? '系统' : '自定义'}
        </Tag>
      ),
    },
  ];

  // 处理创建角色
  const handleCreateRole = () => {
    setEditingRole(null);
    form.resetFields();
    setIsRoleModalVisible(true);
  };

  // 处理编辑角色
  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue(role);
    setIsRoleModalVisible(true);
  };

  // 处理删除角色
  const handleDeleteRole = (roleId: string) => {
    deleteRoleMutation.mutate(roleId);
  };

  // 处理分配权限
  const handleAssignPermissions = (role: Role) => {
    setSelectedRole(role);
    const selectedKeys = role.permissions.map(p => p.id);
    permissionForm.setFieldsValue({ permissions: selectedKeys });
    setIsPermissionModalVisible(true);
  };

  // 提交角色表单
  const handleRoleSubmit = async (values: any) => {
    try {
      if (editingRole) {
        await updateRoleMutation.mutateAsync({
          roleId: editingRole.id,
          roleData: values,
        });
      } else {
        await createRoleMutation.mutateAsync(values);
      }
      setIsRoleModalVisible(false);
      form.resetFields();
    } catch (error) {
      // 错误处理已在mutation中完成
    }
  };

  // 提交权限分配
  const handlePermissionSubmit = async (values: any) => {
    if (!selectedRole) return;

    try {
      await assignPermissionsMutation.mutateAsync({
        roleId: selectedRole.id,
        permissionIds: values.permissions,
      });
      setIsPermissionModalVisible(false);
      permissionForm.resetFields();
    } catch (error) {
      // 错误处理已在mutation中完成
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <SafetyOutlined /> 权限管理
        </Title>
        <Text type="secondary">
          管理系统角色和权限，控制用户访问权限
        </Text>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总权限数"
                value={stats.totalPermissions}
                prefix={<KeyOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总角色数"
                value={stats.totalRoles}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="系统角色"
                value={stats.systemRoles}
                prefix={<SafetyOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="自定义角色"
                value={stats.customRoles}
                prefix={<EditOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* 角色管理 */}
          <TabPane tab="角色管理" key="roles">
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateRole}
              >
                创建角色
              </Button>
            </div>
            
            <Table
              columns={roleColumns}
              dataSource={roles}
              loading={rolesLoading}
              rowKey="id"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </TabPane>

          {/* 权限列表 */}
          <TabPane tab="权限列表" key="permissions">
            <Table
              columns={permissionColumns}
              dataSource={permissions}
              loading={permissionsLoading}
              rowKey="id"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </TabPane>

          {/* 审计日志 */}
          <TabPane tab="审计日志" key="audit">
            <Timeline>
              {auditLogs?.list.map((log) => (
                <Timeline.Item
                  key={log.id}
                  color={log.action === 'delete' ? 'red' : 'blue'}
                  dot={<HistoryOutlined />}
                >
                  <div>
                    <Text strong>{log.operatorName}</Text>
                    <Text type="secondary"> {log.action === 'assign' ? '分配了' : log.action === 'create' ? '创建了' : log.action === 'update' ? '更新了' : '删除了'} </Text>
                    <Text>{log.targetName}</Text>
                  </div>
                  <div>
                    <Text type="secondary">{log.details}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </TabPane>
        </Tabs>
      </Card>

      {/* 角色编辑模态框 */}
      <Modal
        title={editingRole ? '编辑角色' : '创建角色'}
        open={isRoleModalVisible}
        onCancel={() => {
          setIsRoleModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRoleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="角色名称"
                rules={[
                  { required: true, message: '请输入角色名称' },
                  { max: 50, message: '角色名称不能超过50个字符' },
                ]}
              >
                <Input placeholder="请输入角色名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="角色代码"
                rules={[
                  { required: true, message: '请输入角色代码' },
                  { pattern: /^[a-zA-Z0-9_]+$/, message: '角色代码只能包含字母、数字和下划线' },
                ]}
              >
                <Input 
                  placeholder="请输入角色代码" 
                  disabled={editingRole?.isSystem}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="角色描述"
            rules={[
              { required: true, message: '请输入角色描述' },
              { max: 200, message: '描述不能超过200个字符' },
            ]}
          >
            <TextArea 
              rows={3} 
              placeholder="请输入角色描述"
              showCount
              maxLength={200}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="level"
                label="权限级别"
                rules={[{ required: true, message: '请设置权限级别' }]}
              >
                <InputNumber
                  min={1}
                  max={99}
                  placeholder="1-99"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isActive"
                label="启用状态"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch
                  checkedChildren="启用"
                  unCheckedChildren="禁用"
                />
              </Form.Item>
            </Col>
          </Row>

          <Alert
            message="权限级别说明"
            description="数字越大权限越高。系统建议：1-20为普通用户，21-60为经理级别，61-80为管理员，81-99为超级管理员。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsRoleModalVisible(false)}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createRoleMutation.isPending || updateRoleMutation.isPending}
              >
                {editingRole ? '更新' : '创建'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* 权限分配模态框 */}
      <Modal
        title={`为角色 "${selectedRole?.name}" 分配权限`}
        open={isPermissionModalVisible}
        onCancel={() => {
          setIsPermissionModalVisible(false);
          permissionForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={permissionForm}
          layout="vertical"
          onFinish={handlePermissionSubmit}
        >
          <Form.Item
            name="permissions"
            label="选择权限"
            rules={[{ required: true, message: '请选择至少一个权限' }]}
          >
            <Tree
              checkable
              treeData={permissionTree}
              height={400}
              style={{ border: '1px solid #d9d9d9', borderRadius: 6, padding: 8 }}
            />
          </Form.Item>

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsPermissionModalVisible(false)}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={assignPermissionsMutation.isPending}
              >
                保存权限
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PermissionManagement; 
