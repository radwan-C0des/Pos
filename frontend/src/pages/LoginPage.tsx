import React from 'react';
import { Form, Input, Button, Card, Typography, Checkbox } from 'antd';
import { ShoppingCartOutlined, EyeTwoTone, EyeInvisibleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const { Title, Text, Link: AntLink } = Typography;

const LoginPage: React.FC = () => {
    const [loading, setLoading] = React.useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', values);
            login(data.accessToken, data.refreshToken, data.user);
            navigate('/');
        } catch (error: any) {
            // Error handled by axios interceptor
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#f8f9fa',
            backgroundImage: 'radial-gradient(#dee2e6 1px, transparent 1px)',
            backgroundSize: '30px 30px'
        }}>
            <Card style={{ width: 440, borderRadius: 12, padding: '24px 12px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div className="posbuzz-logo" style={{ justifyContent: 'center', marginBottom: 24 }}>
                        <div className="posbuzz-logo-icon">
                            <ShoppingCartOutlined style={{ fontSize: 24 }} />
                        </div>
                        <span>PosBuzz</span>
                    </div>
                    <Title level={2} style={{ marginTop: 0, marginBottom: 8, fontWeight: 700 }}>Welcome back</Title>
                    <Text type="secondary">Please enter your details to sign in.</Text>
                </div>

                <Form
                    name="login"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                    initialValues={{ remember: true }}
                >
                    <Form.Item
                        label={<Text strong>Email</Text>}
                        name="email"
                        rules={[{ required: true, message: 'Please input your email!' }, { type: 'email' }]}
                    >
                        <Input placeholder="name@company.com" style={{ borderRadius: 8 }} />
                    </Form.Item>

                    <Form.Item
                        label={<Text strong>Password</Text>}
                        name="password"
                        rules={[{ required: true, message: 'Please input your password!' }]}
                    >
                        <Input.Password
                            placeholder="••••••••"
                            style={{ borderRadius: 8 }}
                            iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                        />
                    </Form.Item>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox>Remember for 30 days</Checkbox>
                        </Form.Item>
                        <AntLink style={{ fontWeight: 500 }}>Forgot password?</AntLink>
                    </div>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 48, borderRadius: 8, fontSize: 16, fontWeight: 600 }}>
                            Sign in
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <Text type="secondary">Don't have an account? </Text>
                        <AntLink onClick={() => navigate('/register')} style={{ fontWeight: 500 }}>Contact Support</AntLink>
                    </div>
                </Form>
            </Card>

            <div style={{ marginTop: 24 }}>
                <div style={{
                    background: 'white',
                    padding: '4px 16px',
                    borderRadius: 20,
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                    <Text style={{ fontSize: 12, color: '#4b5563' }}>System Status: Operational</Text>
                </div>
            </div>

            <div style={{ marginTop: 40, borderTop: 'none' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>© 2023 PosBuzz Inc. All rights reserved.</Text>
            </div>
        </div>
    );
};

export default LoginPage;
