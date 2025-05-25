import React from 'react';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Breadcrumb,
  theme,
  Space,
  Badge,
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  DashboardOutlined,
  TeamOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { Link, useLocation } from '@tanstack/react-router';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useLogout } from '../hooks/useAuthQuery';
import type { MenuItem } from '../types/common';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

// 菜单配置
const menuItems: MenuItem[] = [
  {
    key: '/dashboard',
    label: '仪表盘',
    icon: <DashboardOutlined />,
    path: '/dashboard',
  },
  {
    key: '/users',
    label: '用户管理',
    icon: <TeamOutlined />,
    path: '/users',
  },
  {
    key: '/permissions',
    label: '权限管理',
    icon: <SettingOutlined />,
    path: '/permissions',
  },
  {
    key: '/products',
    label: '产品管理',
    icon: <ShoppingOutlined />,
    children: [
      {
        key: '/products/list',
        label: '产品列表',
        path: '/products/list',
      },
      {
        key: '/products/categories',
        label: '产品分类',
        path: '/products/categories',
      },
    ],
  },
  {
    key: '/orders',
    label: '订单管理',
    icon: <FileTextOutlined />,
    path: '/orders',
  },
  {
    key: '/analytics',
    label: '数据分析',
    icon: <BarChartOutlined />,
    children: [
      {
        key: '/analytics/sales',
        label: '销售分析',
        path: '/analytics/sales',
      },
      {
        key: '/analytics/users',
        label: '用户分析',
        path: '/analytics/users',
      },
    ],
  },
];

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const {
    collapsed,
    breadcrumbs,
    toggleCollapsed,
  } = useAppStore();
  
  const { user: currentUser } = useAuthStore();
  const logoutMutation = useLogout();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 处理登出
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      // 错误处理已在mutation中完成
    }
  };

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      handleLogout();
    }
    // 其他菜单项通过 Link 组件处理导航
  };

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">个人资料</Link>,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">系统设置</Link>,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const pathname = location.pathname;
    return [pathname];
  };

  // 获取展开的菜单项
  const getOpenKeys = () => {
    const pathname = location.pathname;
    const openKeys: string[] = [];
    
    menuItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => 
          pathname.startsWith(child.path || '')
        );
        if (hasActiveChild) {
          openKeys.push(item.key);
        }
      }
    });
    
    return openKeys;
  };

  // 渲染菜单项
  const renderMenuItems = (items: MenuItem[]): any[] => {
    return items.map(item => {
      if (item.children) {
        return {
          key: item.key,
          icon: item.icon,
          label: item.label,
          children: renderMenuItems(item.children),
        };
      }
      
      return {
        key: item.key,
        icon: item.icon,
        label: item.path ? (
          <Link to={item.path}>{item.label}</Link>
        ) : (
          item.label
        ),
      };
    });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{
          height: 32,
          margin: 16,
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: collapsed ? 14 : 16,
        }}>
          {collapsed ? 'CMS' : '企业管理系统'}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={renderMenuItems(menuItems)}
        />
      </Sider>
      
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapsed}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            
            {breadcrumbs.length > 0 && (
              <Breadcrumb
                items={breadcrumbs.map(item => ({
                  title: item.path ? (
                    <Link to={item.path}>{item.title}</Link>
                  ) : (
                    item.title
                  ),
                }))}
              />
            )}
          </Space>

          <Space size="middle">
            <Badge count={5} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ fontSize: '16px' }}
              />
            </Badge>
            
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleMenuClick }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  src={currentUser?.avatar}
                />
                <span>{currentUser?.realName}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Content
          style={{
            margin: '16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 
