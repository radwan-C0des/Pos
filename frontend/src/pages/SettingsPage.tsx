import React, { useState, useEffect, useRef } from 'react';
import {
    Card,
    Form,
    Input,
    Button,
    Space,
    Tabs,
    Row,
    Col,
    Avatar,
    Typography,
    Divider,
    Switch,
    Select,
    message,
    Modal,
    Statistic,
    Skeleton,
    Tag,
} from 'antd';
import {
    UserOutlined,
    LockOutlined,
    BellOutlined,
    SafetyOutlined,
    ShoppingCartOutlined,
    CameraOutlined,
    SaveOutlined,
    ExclamationCircleOutlined,
    LoadingOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import dayjs from 'dayjs';
import { useLocalization } from '../context/LocalizationContext';

const { Title, Text, Paragraph } = Typography;

const SettingsPage: React.FC = () => {
    const { user, logout } = useAuth();
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const queryClient = useQueryClient();
    const { preferences, setPreferences, savePreferences } = useLocalization();
    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        lowStockAlerts: true,
        salesAlerts: true,
        promotionEmails: false,
    });
    const [profileImageUrl, setProfileImageUrl] = useState<string>('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch user profile data
    const { data: profileData, isLoading: profileLoading } = useQuery({
        queryKey: ['user-profile'],
        queryFn: async () => {
            const { data } = await api.get('/auth/profile');
            return data;
        },
        staleTime: 5 * 60 * 1000,
    });

    // Fetch total sales count
    const { data: salesData, isLoading: salesLoading } = useQuery({
        queryKey: ['user-sales-count'],
        queryFn: async () => {
            const { data } = await api.get('/sales', { params: { limit: 1, page: 1 } });
            return data;
        },
        staleTime: 5 * 60 * 1000,
    });

    // Initialize form with profile data
    useEffect(() => {
        if (profileData) {
            form.setFieldsValue({
                fullName: profileData.full_name || '',
                email: profileData.email,
                phone: profileData.phone || '',
                company: profileData.company || '',
                address: profileData.address || '',
            });
            // Set profile image URL with full hostname if it exists
            if (profileData.profile_image_url) {
                const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                setProfileImageUrl(`${apiBaseUrl}${profileData.profile_image_url}`);
            } else {
                setProfileImageUrl('');
            }
        }
    }, [profileData, form]);

    // Handle profile image upload
    const handleProfileImageUpload = async (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            message.error('Please select a valid image file');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            message.error('Image size must be less than 5MB');
            return;
        }

        setUploadingImage(true);

        // Show preview immediately from file (without compression)
        const previewUrl = URL.createObjectURL(file);
        setProfileImageUrl(previewUrl);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/uploads/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                const imageUrlWithHost = `${apiBaseUrl}${response.data.imageUrl}`;
                setProfileImageUrl(imageUrlWithHost);
                message.success('Profile image updated successfully!');

                // Refetch all profile-related queries to sync everywhere
                setTimeout(() => {
                    queryClient.invalidateQueries({ queryKey: ['user-profile'] });
                    queryClient.invalidateQueries({ queryKey: ['navbar-user-profile'] });
                }, 500);
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to upload image');
            // Reset preview on error
            URL.revokeObjectURL(previewUrl);
            setProfileImageUrl('');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                message.error('Please select a valid image file');
                return;
            }
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                message.error('File size must be less than 5MB');
                return;
            }
            handleProfileImageUpload(file);
        }
    };

    // Profile update mutation
    const profileMutation = useMutation({
        mutationFn: (values: any) =>
            api.put('/auth/profile', {
                full_name: values.fullName,
                phone: values.phone,
                company: values.company,
                address: values.address,
            }),
        onSuccess: () => {
            message.success('Profile updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        },
        onError: (error: any) => message.error(error.response?.data?.message || 'Failed to update profile'),
    });

    // Password change mutation
    const passwordMutation = useMutation({
        mutationFn: (values: any) =>
            api.post('/auth/change-password', {
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            }),
        onSuccess: () => {
            message.success('Password changed successfully!');
            passwordForm.resetFields();
        },
        onError: (error: any) => message.error(error.response?.data?.message || 'Failed to change password'),
    });

    const handleProfileUpdate = async (values: any) => {
        profileMutation.mutate(values);
    };

    const handlePasswordChange = async (values: any) => {
        if (values.newPassword !== values.confirmPassword) {
            message.error('Passwords do not match');
            return;
        }
        passwordMutation.mutate(values);
    };

    const handleNotificationsSave = async () => {
        try {
            await api.put('/auth/notifications', notifications);
            message.success('Notification preferences saved!');
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to save preferences');
        }
    };

    const handlePreferencesSave = async () => {
        try {
            await savePreferences();
            message.success('Preferences saved! Reload the page to see changes.');
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to save preferences');
        }
    };

    const handleLogout = () => {
        Modal.confirm({
            title: 'Confirm Logout',
            icon: <ExclamationCircleOutlined />,
            content: 'Are you sure you want to logout?',
            okText: 'Yes',
            cancelText: 'No',
            onOk() {
                logout();
            },
        });
    };

    const userInitials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'U';
    const totalSalesCount = salesData?.total || 0;
    const accountCreatedDate = profileData?.created_at ? dayjs(profileData.created_at).format('MMM DD, YYYY') : 'Loading...';

    const tabItems = [
        {
            key: 'profile',
            label: (
                <span>
                    <UserOutlined />
                    Profile
                </span>
            ),
            children: (
                <div style={{ padding: '24px' }}>
                    {profileLoading ? (
                        <Skeleton active />
                    ) : (
                        <Row gutter={24}>
                            <Col xs={24} md={8}>
                                <Card style={{ textAlign: 'center', borderRadius: 12, border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                    <div style={{ marginBottom: 16, position: 'relative', display: 'inline-block' }}>
                                        <Avatar
                                            size={100}
                                            src={profileImageUrl}
                                            style={{
                                                backgroundColor: '#1677ff',
                                                fontSize: 40,
                                                fontWeight: 700,
                                            }}
                                        >
                                            {!profileImageUrl && userInitials}
                                        </Avatar>
                                    </div>
                                    <Title level={4} style={{ marginBottom: 0 }}>
                                        {profileData?.email}
                                    </Title>
                                    <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                                        Account Member
                                    </Text>
                                    <Divider style={{ margin: '16px 0' }} />
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <Button
                                            icon={uploadingImage ? <LoadingOutlined /> : <CameraOutlined />}
                                            block
                                            style={{ borderRadius: 8, height: 40 }}
                                            onClick={() => fileInputRef.current?.click()}
                                            loading={uploadingImage}
                                        >
                                            Change Photo
                                        </Button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={handleFileSelect}
                                        />
                                    </Space>
                                </Card>
                            </Col>

                            <Col xs={24} md={16}>
                                <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        onFinish={handleProfileUpdate}
                                        autoComplete="off"
                                    >
                                        <Form.Item
                                            label={<Text strong>Full Name</Text>}
                                            name="fullName"
                                            rules={[{ required: true, message: 'Please enter your full name!' }]}
                                        >
                                            <Input placeholder="John Doe" style={{ borderRadius: 8, height: 40 }} />
                                        </Form.Item>

                                        <Form.Item
                                            label={<Text strong>Email Address</Text>}
                                            name="email"
                                            rules={[{ required: true, type: 'email', message: 'Please enter a valid email!' }]}
                                        >
                                            <Input placeholder="john@example.com" style={{ borderRadius: 8, height: 40 }} disabled />
                                        </Form.Item>

                                        <Form.Item
                                            label={<Text strong>Phone Number</Text>}
                                            name="phone"
                                        >
                                            <Input placeholder="+1 (555) 123-4567" style={{ borderRadius: 8, height: 40 }} />
                                        </Form.Item>

                                        <Form.Item
                                            label={<Text strong>Company Name</Text>}
                                            name="company"
                                        >
                                            <Input placeholder="Your Business" style={{ borderRadius: 8, height: 40 }} />
                                        </Form.Item>

                                        <Form.Item
                                            label={<Text strong>Address</Text>}
                                            name="address"
                                        >
                                            <Input placeholder="123 Main Street" style={{ borderRadius: 8, height: 40 }} />
                                        </Form.Item>

                                        <Space style={{ marginTop: 24 }}>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                loading={profileMutation.isPending}
                                                icon={<SaveOutlined />}
                                                style={{ borderRadius: 8, height: 40 }}
                                            >
                                                Save Changes
                                            </Button>
                                            <Button
                                                style={{ borderRadius: 8, height: 40 }}
                                                onClick={() => form.resetFields()}
                                            >
                                                Cancel
                                            </Button>
                                        </Space>
                                    </Form>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </div>
            ),
        },
        {
            key: 'security',
            label: (
                <span>
                    <LockOutlined />
                    Security
                </span>
            ),
            children: (
                <div style={{ padding: '24px' }}>
                    <Card style={{ borderRadius: 12, border: 'none', marginBottom: 24, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                        <Title level={4}>Change Password</Title>
                        <Paragraph type="secondary">
                            Keep your account secure by updating your password regularly
                        </Paragraph>

                        <Form
                            form={passwordForm}
                            layout="vertical"
                            onFinish={handlePasswordChange}
                            autoComplete="off"
                        >
                            <Form.Item
                                label={<Text strong>Current Password</Text>}
                                name="currentPassword"
                                rules={[{ required: true, message: 'Please enter your current password!' }]}
                            >
                                <Input.Password
                                    placeholder="Enter current password"
                                    style={{ borderRadius: 8, height: 40 }}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<Text strong>New Password</Text>}
                                name="newPassword"
                                rules={[
                                    { required: true, message: 'Please enter a new password!' },
                                    { min: 8, message: 'Password must be at least 8 characters!' },
                                ]}
                            >
                                <Input.Password
                                    placeholder="Enter new password"
                                    style={{ borderRadius: 8, height: 40 }}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<Text strong>Confirm Password</Text>}
                                name="confirmPassword"
                                rules={[{ required: true, message: 'Please confirm your password!' }]}
                            >
                                <Input.Password
                                    placeholder="Confirm new password"
                                    style={{ borderRadius: 8, height: 40 }}
                                />
                            </Form.Item>

                            <Space style={{ marginTop: 24 }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={passwordMutation.isPending}
                                    danger
                                    style={{ borderRadius: 8, height: 40 }}
                                >
                                    Update Password
                                </Button>
                                <Button
                                    style={{ borderRadius: 8, height: 40 }}
                                    onClick={() => passwordForm.resetFields()}
                                >
                                    Cancel
                                </Button>
                            </Space>
                        </Form>
                    </Card>

                    <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                        <Title level={4}>Two-Factor Authentication</Title>
                        <Paragraph type="secondary">
                            Add an extra layer of security to your account
                        </Paragraph>
                        <Row gutter={16} style={{ marginTop: 16 }}>
                            <Col span={12}>
                                <Text strong>Enable 2FA</Text>
                                <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                                    Requires authentication app
                                </Paragraph>
                            </Col>
                            <Col span={12} style={{ textAlign: 'right' }}>
                                <Switch defaultChecked={false} />
                            </Col>
                        </Row>
                    </Card>
                </div>
            ),
        },
        {
            key: 'notifications',
            label: (
                <span>
                    <BellOutlined />
                    Notifications
                </span>
            ),
            children: (
                <div style={{ padding: '24px' }}>
                    <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                        <Title level={4}>Notification Preferences</Title>

                        {[
                            {
                                key: 'emailNotifications',
                                label: 'Email Notifications',
                                description: 'Receive email notifications about your account',
                            },
                            {
                                key: 'lowStockAlerts',
                                label: 'Low Stock Alerts',
                                description: 'Get notified when product stock is running low',
                            },
                            {
                                key: 'salesAlerts',
                                label: 'Sales Alerts',
                                description: 'Receive notifications for each completed sale',
                            },
                            {
                                key: 'promotionEmails',
                                label: 'Promotion Emails',
                                description: 'Receive promotional offers and news',
                            },
                        ].map((item: any, index: number) => (
                            <div key={item.key}>
                                <Row gutter={16} style={{ paddingBottom: 16 }}>
                                    <Col span={12}>
                                        <Text strong>{item.label}</Text>
                                        <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                                            {item.description}
                                        </Paragraph>
                                    </Col>
                                    <Col span={12} style={{ textAlign: 'right' }}>
                                        <Switch
                                            checked={notifications[item.key as keyof typeof notifications]}
                                            onChange={(checked) =>
                                                setNotifications({
                                                    ...notifications,
                                                    [item.key]: checked,
                                                })
                                            }
                                        />
                                    </Col>
                                </Row>
                                {index < 3 && <Divider style={{ margin: '12px 0' }} />}
                            </div>
                        ))}

                        <Space style={{ marginTop: 24 }}>
                            <Button
                                type="primary"
                                onClick={handleNotificationsSave}
                                style={{ borderRadius: 8, height: 40 }}
                            >
                                Save Preferences
                            </Button>
                        </Space>
                    </Card>
                </div>
            ),
        },
        {
            key: 'preferences',
            label: (
                <span>
                    <SafetyOutlined />
                    Preferences
                </span>
            ),
            children: (
                <div style={{ padding: '24px' }}>
                    <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                        <Title level={4}>Application Preferences</Title>

                        <Form layout="vertical">
                            <Form.Item label={<Text strong>Currency</Text>}>
                                <Select
                                    value={preferences.currency}
                                    onChange={(value) => setPreferences({ ...preferences, currency: value })}
                                    options={[
                                        { label: 'USD ($)', value: 'USD' },
                                        { label: 'EUR (€)', value: 'EUR' },
                                        { label: 'GBP (£)', value: 'GBP' },
                                        { label: 'INR (₹)', value: 'INR' },
                                        { label: 'BDT (৳)', value: 'BDT' },
                                    ]}
                                    style={{ height: 40 }}
                                />
                            </Form.Item>

                            <Form.Item label={<Text strong>Date Format</Text>}>
                                <Select
                                    value={preferences.dateFormat}
                                    onChange={(value) => setPreferences({ ...preferences, dateFormat: value })}
                                    options={[
                                        { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
                                        { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
                                        { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
                                    ]}
                                    style={{ height: 40 }}
                                />
                            </Form.Item>

                            <Form.Item label={<Text strong>Language</Text>}>
                                <Select
                                    value={preferences.language}
                                    onChange={(value) => setPreferences({ ...preferences, language: value })}
                                    options={[
                                        { label: 'English', value: 'en' },
                                        { label: 'বাংলা (Bengali)', value: 'bn' },
                                        { label: 'Spanish', value: 'es' },
                                        { label: 'French', value: 'fr' },
                                        { label: 'German', value: 'de' },
                                    ]}
                                    style={{ height: 40 }}
                                />
                            </Form.Item>

                            <Space style={{ marginTop: 24 }}>
                                <Button
                                    type="primary"
                                    onClick={handlePreferencesSave}
                                    style={{ borderRadius: 8, height: 40 }}
                                >
                                    Save Preferences
                                </Button>
                            </Space>
                        </Form>
                    </Card>
                </div>
            ),
        },
        {
            key: 'account',
            label: (
                <span>
                    <ShoppingCartOutlined />
                    Account
                </span>
            ),
            children: (
                <div style={{ padding: '24px' }}>
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Card style={{ borderRadius: 12, border: 'none', marginBottom: 24, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                <Title level={4}>Account Information</Title>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Row>
                                        <Col span={12}>
                                            <Text type="secondary">Account Created</Text>
                                        </Col>
                                        <Col span={12} style={{ textAlign: 'right' }}>
                                            <Text strong>
                                                {profileLoading ? <LoadingOutlined /> : accountCreatedDate}
                                            </Text>
                                        </Col>
                                    </Row>
                                    <Divider style={{ margin: '12px 0' }} />
                                    <Row>
                                        <Col span={12}>
                                            <Text type="secondary">Account Status</Text>
                                        </Col>
                                        <Col span={12} style={{ textAlign: 'right' }}>
                                            <Tag color="green">Active</Tag>
                                        </Col>
                                    </Row>
                                    <Divider style={{ margin: '12px 0' }} />
                                    <Row>
                                        <Col span={12}>
                                            <Text type="secondary">Account Type</Text>
                                        </Col>
                                        <Col span={12} style={{ textAlign: 'right' }}>
                                            <Text strong>Standard</Text>
                                        </Col>
                                    </Row>
                                </Space>
                            </Card>
                        </Col>

                        <Col xs={24} md={12}>
                            <Card style={{ borderRadius: 12, border: 'none', marginBottom: 24, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                {salesLoading ? (
                                    <Skeleton active />
                                ) : (
                                    <>
                                        <Statistic
                                            title={<Text strong>Total Sales Transactions</Text>}
                                            value={totalSalesCount}
                                            prefix={<ShoppingCartOutlined />}
                                            valueStyle={{ color: '#1677ff', fontWeight: 700 }}
                                        />
                                        <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                                            Completed transactions
                                        </Text>
                                    </>
                                )}
                            </Card>
                        </Col>
                    </Row>

                    <Card style={{ borderRadius: 12, border: 'none', borderTop: '2px solid #ff4d4f', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                        <Title level={4} style={{ color: '#ff4d4f', marginBottom: 8 }}>
                            <ExclamationCircleOutlined style={{ marginRight: 8 }} />
                            Danger Zone
                        </Title>
                        <Paragraph type="secondary">
                            Irreversible and dangerous actions
                        </Paragraph>

                        <Space style={{ marginTop: 16 }}>
                            <Button
                                danger
                                onClick={handleLogout}
                                style={{ borderRadius: 8, height: 40 }}
                            >
                                Logout
                            </Button>
                            <Button
                                danger
                                style={{ borderRadius: 8, height: 40 }}
                                onClick={() => {
                                    Modal.confirm({
                                        title: 'Delete Account',
                                        content: 'Are you sure you want to delete your account? This action cannot be undone.',
                                        okText: 'Delete',
                                        cancelText: 'Cancel',
                                        okButtonProps: { danger: true },
                                    });
                                }}
                            >
                                Delete Account
                            </Button>
                        </Space>
                    </Card>
                </div>
            ),
        },
    ];

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 0' }}>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0, marginBottom: 8, fontWeight: 700 }}>
                    <SettingOutlined style={{ marginRight: 8 }} />
                    Settings
                </Title>
                <Text type="secondary">Manage your account settings and preferences</Text>
            </div>

            <Tabs
                items={tabItems}
                defaultActiveKey="profile"
                style={{
                    background: 'white',
                    borderRadius: 12,
                    padding: 0,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
                tabBarStyle={{
                    paddingLeft: 24,
                    margin: 0,
                    borderBottom: '1px solid #f0f0f0',
                }}
            />
        </div>
    );
};

export default SettingsPage;
