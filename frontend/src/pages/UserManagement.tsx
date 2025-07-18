import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Avatar,
  Popconfirm,
  Modal,
  Row,
  Col,
  Tooltip,
  Drawer,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  UserOutlined,
  KeyOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useUserStore } from '../stores/userStore';
import { useUserList, useDeleteUser, useResetPassword } from '../hooks/useUserQuery';
import { departments } from '../services/mockData';
import UserForm from '../components/UserForm';
import UserDetail from '../components/UserDetail';
import UserRoleAssignment from '../components/UserRoleAssignment';
import type { User } from '../types/user';

const { Search } = Input;
const { Option } = Select;

const UserManagement: React.FC = () => {

  const { searchParams, setSearchParams } = useUserStore();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [roleAssignUser, setRoleAssignUser] = useState<User | null>(null);

  // API hooks
  const { data: userListData, isLoading, refetch } = useUserList(searchParams);
  const deleteUserMutation = useDeleteUser();
  const resetPasswordMutation = useResetPassword();

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

  // 表格列配置
  const columns: ColumnsType<User> = [
    {
      title: '用户信息',
      key: 'userInfo',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar
            size="small"
            src={record.avatar_url}
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{record.full_name}</div>
            <div style={{ fontSize: 12, color: '#666' }}>@{record.username}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 100,
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
      width: 120,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 80,
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : role === 'manager' ? 'blue' : 'default'}>
          {roleTexts[role as keyof typeof roleTexts]}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={statusColors[status as keyof typeof statusColors]}>
          {statusTexts[status as keyof typeof statusTexts]}
        </Tag>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewUser(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
            />
          </Tooltip>
          <Tooltip title="分配角色">
            <Button
              type="text"
              size="small"
              icon={<KeyOutlined />}
              onClick={() => handleAssignRole(record)}
            />
          </Tooltip>
          <Tooltip title="重置密码">
            <Popconfirm
              title="确定要重置该用户的密码吗？"
              onConfirm={() => handleResetPassword(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                icon={<KeyOutlined />}
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除该用户吗？"
              onConfirm={() => handleDeleteUser(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchParams({ search: value, page: 1 });
  };

  // 处理筛选
  const handleFilter = (key: string, value: any) => {
    setSearchParams({ [key]: value, page: 1 });
  };

  // 处理分页
  const handleTableChange = (pagination: any) => {
    setSearchParams({
      page: pagination.current,
      page_size: pagination.pageSize,
    });
  };

  // 处理新增用户
  const handleAddUser = () => {
    setEditingUser(null);
    setIsModalVisible(true);
  };

  // 处理编辑用户
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalVisible(true);
  };

  // 处理查看用户详情
  const handleViewUser = (user: User) => {
    setViewingUser(user);
    setIsDetailVisible(true);
  };

  // 处理删除用户
  const handleDeleteUser = (id: number) => {
    deleteUserMutation.mutate(id);
  };

  // 处理重置密码
  const handleResetPassword = (id: number) => {
    resetPasswordMutation.mutate(id);
  };

  // 处理表单提交成功
  const handleFormSuccess = () => {
    setIsModalVisible(false);
    setEditingUser(null);
    refetch();
  };

  // 处理角色分配
  const handleAssignRole = (user: User) => {
    setRoleAssignUser(user);
    setIsRoleModalVisible(true);
  };

  // 处理角色分配提交
  const handleRoleAssignSubmit = async (userId: number, roleIds: number[]) => {
    try {
      // 这里应该调用角色分配API
      console.log('分配角色:', { userId, roleIds });
      message.success('角色分配成功');
      setIsRoleModalVisible(false);
      refetch();
    } catch (error) {
      message.error('角色分配失败');
    }
  };

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys as string[]);
    },
  };

  return (
    <div>
      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Search
              placeholder="搜索用户名、姓名、邮箱或手机号"
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择部门"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilter('department', value)}
            >
              {departments.map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择状态"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilter('status', value)}
            >
              <Option value="active">正常</Option>
              <Option value="inactive">禁用</Option>
              <Option value="pending">待审核</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择角色"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilter('role', value)}
            >
              <Option value="admin">管理员</Option>
              <Option value="manager">经理</Option>
              <Option value="user">普通用户</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddUser}
              >
                新增用户
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
              >
                刷新
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={userListData?.items || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.page_size,
            total: userListData?.pagination.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 用户表单弹窗 */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingUser(null);
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <UserForm
          user={editingUser}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingUser(null);
          }}
        />
      </Modal>

      {/* 用户详情抽屉 */}
      <Drawer
        title="用户详情"
        placement="right"
        width={600}
        open={isDetailVisible}
        onClose={() => {
          setIsDetailVisible(false);
          setViewingUser(null);
        }}
      >
        {viewingUser && (
          <UserDetail
            user={viewingUser}
            onEdit={() => {
              setIsDetailVisible(false);
              handleEditUser(viewingUser);
            }}
          />
        )}
      </Drawer>

      {/* 角色分配模态框 */}
      <UserRoleAssignment
        visible={isRoleModalVisible}
        user={roleAssignUser}
        onCancel={() => {
          setIsRoleModalVisible(false);
          setRoleAssignUser(null);
        }}
        onSubmit={handleRoleAssignSubmit}
      />
    </div>
  );
};

export default UserManagement; 
