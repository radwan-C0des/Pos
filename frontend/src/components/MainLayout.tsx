import { Layout, Menu, Badge, Breadcrumb, Dropdown, Empty, Avatar, Typography, List } from 'antd';
import {
    DashboardOutlined,
    ShoppingOutlined,
    ShoppingCartOutlined,
    UserOutlined,
    FileTextOutlined,
    SettingOutlined,
    LogoutOutlined,
    BellOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useNotifications } from '../context/NotificationContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const collapsed = false;
    const { notifications, unreadCount, markAllAsRead } = useNotifications();

    // Fetch user profile with image
    const { data: profileData } = useQuery({
        queryKey: ['navbar-user-profile'],
        queryFn: async () => {
            const { data } = await api.get('/auth/profile');
            return data;
        },
        enabled: !!user, // Only fetch if user is logged in
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: true, // Refetch when window regains focus
        retry: false, // Don't retry on failure
    });

    const getBreadcrumbs = () => {
        const pathSnippets = location.pathname.split('/').filter((i) => i);
        const breadcrumbItems = [
            { title: <Link to="/">Home</Link> },
            ...pathSnippets.map((_, index) => {
                const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
                const title = pathSnippets[index].charAt(0).toUpperCase() + pathSnippets[index].slice(1);
                return { title: <Link to={url}>{title}</Link> };
            }),
        ];
        return breadcrumbItems;
    };

    const menuItems = [
        {
            key: '/',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/products',
            icon: <ShoppingOutlined />,
            label: 'Inventory',
        },
        {
            key: '/sales/new',
            icon: <ShoppingCartOutlined />,
            label: 'Sales',
        },
        {
            key: '/customers',
            icon: <UserOutlined />,
            label: 'Customers',
        },
        {
            key: '/reports',
            icon: <FileTextOutlined />,
            label: 'Reports',
        },
    ];

    const systemItems = [
        {
            key: '/settings',
            icon: <SettingOutlined />,
            label: 'Settings',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            onClick: logout,
        },
    ];

    const userInitials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'U';

    return (
        <Layout style={{ height: '100vh', overflow: 'hidden' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={240}
                theme="light"
                style={{ height: '100vh', overflowY: 'auto' }}
            >
                <div style={{ padding: '24px 16px', marginBottom: 8 }}>
                    <div className="posbuzz-logo">
                        <div className="posbuzz-logo-icon">
                            <ShoppingCartOutlined />
                        </div>
                        {!collapsed && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ lineHeight: 1 }}>PosBuzz</span>
                                <span style={{ fontSize: 11, fontWeight: 400, color: '#6b7280' }}>Management System</span>
                            </div>
                        )}
                    </div>
                </div>

                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={({ key }) => navigate(key)}
                    style={{ padding: '0 8px' }}
                />

                <div style={{ marginTop: 24, padding: '0 16px 8px', fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>
                    {!collapsed && 'System'}
                </div>

                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={systemItems}
                    onClick={({ key }) => key !== 'logout' && navigate(key)}
                    style={{ padding: '0 8px' }}
                />

                <div style={{ position: 'absolute', bottom: 16, width: '100%', padding: '0 16px' }}>
                    {!collapsed && (
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>
                            © 2023 PosBuzz Inc.
                        </div>
                    )}
                </div>
            </Sider>

            <Layout style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Header style={{
                    padding: '0 24px',
                    background: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: 64,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Breadcrumb items={getBreadcrumbs()} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <Dropdown
                            dropdownRender={() => (
                                <div style={{ background: 'white', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', width: 360, maxHeight: 400, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text strong>Notifications</Text>
                                        {unreadCount > 0 && <a onClick={markAllAsRead} style={{ fontSize: 12 }}>Mark all as read</a>}
                                    </div>
                                    <div style={{ overflowY: 'auto', maxHeight: 340 }}>
                                        {notifications.length === 0 ? <Empty description="No notifications" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '40px 0' }} /> : (
                                            <List dataSource={notifications} renderItem={(item) => (
                                                <List.Item style={{ padding: '12px 16px', background: item.read ? 'white' : '#f0f7ff', borderBottom: '1px solid #f0f0f0' }}>
                                                    <List.Item.Meta avatar={<Avatar style={{ background: '#52c41a' }} icon={<ShoppingCartOutlined />} />} title={<div style={{ display: 'flex', justifyContent: 'space-between' }}><Text strong={!item.read}>{item.message}</Text>{!item.read && <Badge status="processing" />}</div>} description={<Text type="secondary" style={{ fontSize: 12 }}>{dayjs(item.created_at).fromNow()}</Text>} />
                                                </List.Item>
                                            )} />
                                        )}
                                    </div>
                                </div>
                            )}
                            trigger={['click']}
                            placement="bottomRight"
                            onOpenChange={(open) => { if (open && unreadCount > 0) setTimeout(() => markAllAsRead(), 500); }}
                        >
                            <Badge count={unreadCount} size="small" offset={[-5, 5]}>
                                <BellOutlined style={{ fontSize: 20, cursor: 'pointer', color: '#6b7280' }} />
                            </Badge>
                        </Dropdown>

                        <div 
                            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                            onClick={() => navigate('/settings')}
                        >
                            <Avatar 
                                src={profileData?.profile_image_url ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${profileData.profile_image_url}` : undefined}
                                style={{ backgroundColor: '#1677ff', color: 'white', fontWeight: 600 }}
                            >
                                {userInitials}
                            </Avatar>
                        </div>
                    </div>
                </Header>

                <Content style={{
                    padding: 24,
                    background: '#f8f9fa',
                    flex: 1,
                    overflow: 'auto',
                    height: 'calc(100vh - 64px)'
                }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
