import React, { useState } from 'react';
import { Card, Row, Col, Typography, Table, Tag, Button, Space, Avatar, Select } from 'antd';
import {
    ArrowUpOutlined,
    ArrowDownOutlined,
    ShoppingCartOutlined,
    ShoppingOutlined,
    PlusOutlined,
    BellOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../context/LocalizationContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { formatCurrency, t } = useLocalization();
    const [revenuePeriod, setRevenuePeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');

    // Helper function to get image URL (handles both base64 and regular URLs)
    const getImageUrl = (imageUrl: string | null | undefined) => {
        if (!imageUrl) return null;
        // If it's already a data URI or external URL, return as is
        if (imageUrl.startsWith('data:') || imageUrl.startsWith('http')) {
            return imageUrl;
        }
        // Otherwise, prepend API URL (for backward compatibility)
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        return `${apiBaseUrl}${imageUrl}`;
    };

    const { data: salesData } = useQuery({
        queryKey: ['sales'],
        queryFn: async () => {
            const { data } = await api.get('/sales', { params: { limit: 5 } });
            return data;
        },
    });

    // Fetch all sales for revenue comparison
    const { data: allSalesData } = useQuery({
        queryKey: ['all-sales'],
        queryFn: async () => {
            const { data } = await api.get('/sales', { params: { limit: 1000 } });
            return data;
        },
    });

    const { data: productsData } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { data } = await api.get('/products');
            return data;
        },
    });

    // Calculate revenue for current and previous periods
    const calculateRevenueComparison = () => {
        if (!allSalesData?.sales) return { current: 0, previous: 0, percentage: 0, isIncrease: true };

        const now = dayjs();
        let currentStart: dayjs.Dayjs;
        let previousStart: dayjs.Dayjs;
        let previousEnd: dayjs.Dayjs;

        switch (revenuePeriod) {
            case 'day':
                currentStart = now.startOf('day');
                previousStart = now.subtract(1, 'day').startOf('day');
                previousEnd = now.subtract(1, 'day').endOf('day');
                break;
            case 'week':
                currentStart = now.subtract(7, 'days');
                previousStart = now.subtract(14, 'days');
                previousEnd = now.subtract(7, 'days');
                break;
            case 'month':
                currentStart = now.subtract(30, 'days');
                previousStart = now.subtract(60, 'days');
                previousEnd = now.subtract(30, 'days');
                break;
            case 'year':
                currentStart = now.subtract(1, 'year');
                previousStart = now.subtract(2, 'year');
                previousEnd = now.subtract(1, 'year');
                break;
        }

        const currentRevenue = allSalesData.sales
            .filter((sale: any) => dayjs(sale.created_at).isAfter(currentStart))
            .reduce((acc: number, sale: any) => acc + Number(sale.total_amount), 0);

        const previousRevenue = allSalesData.sales
            .filter((sale: any) => {
                const saleDate = dayjs(sale.created_at);
                return saleDate.isAfter(previousStart) && saleDate.isBefore(previousEnd);
            })
            .reduce((acc: number, sale: any) => acc + Number(sale.total_amount), 0);

        const percentage = previousRevenue > 0 
            ? Math.abs(((currentRevenue - previousRevenue) / previousRevenue) * 100)
            : 0;

        return {
            current: currentRevenue,
            previous: previousRevenue,
            percentage: percentage,
            isIncrease: currentRevenue >= previousRevenue,
        };
    };

    const revenueComparison = calculateRevenueComparison();
    const totalRevenue = revenueComparison.current;
    const totalProducts = productsData?.total || 0;
    const lowStockCount = productsData?.products?.filter((p: any) => p.stock_quantity <= 10)?.length || 0;

    const columns = [
        {
            title: 'TRANSACTION ID',
            dataIndex: 'id',
            key: 'id',
            render: (id: string) => <Text strong>#TRX-{id.slice(0, 4).toUpperCase()}</Text>
        },
        {
            title: 'DATE & TIME',
            dataIndex: 'created_at',
            key: 'date',
            render: (date: string) => <Text type="secondary">{new Date(date).toLocaleString()}</Text>
        },
        {
            title: 'ITEMS SUMMARY',
            key: 'items',
            render: (_: any, record: any) => {
                const firstProduct = record.sale_items?.[0]?.product;
                const productName = firstProduct?.name || 'Unknown Product';
                return (
                    <Space>
                        <Avatar 
                            shape="square" 
                            size={40}
                            src={getImageUrl(firstProduct?.image_url) || undefined}
                            style={{ 
                                backgroundColor: firstProduct?.image_url ? 'transparent' : '#1677ff',
                                borderRadius: 6
                            }}
                        >
                            {!firstProduct?.image_url && '📦'}
                        </Avatar>
                        <Text>{productName} {record.sale_items?.length > 1 ? `+${record.sale_items.length - 1} more` : ''}</Text>
                    </Space>
                );
            }
        },
        {
            title: 'AMOUNT',
            dataIndex: 'total_amount',
            key: 'amount',
            render: (val: any) => <Text strong>{formatCurrency(val)}</Text>
        },
        {
            title: 'STATUS',
            key: 'status',
            render: () => <Tag color="success">Completed</Tag>
        }
    ];

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 700 }}>{t('dashboard')}</Title>
                    <Text type="secondary">Here's what's happening with your store today.</Text>
                </div>
                <Space>
                    <Button icon={<PlusOutlined />} onClick={() => navigate('/products')}>New Product</Button>
                    <Button type="primary" icon={<ShoppingCartOutlined />} onClick={() => navigate('/sales/new')}>New Sale</Button>
                </Space>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                <Col xs={24} md={8}>
                    <Card className="stats-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                                <Text type="secondary" style={{ fontSize: 14 }}>{t('totalRevenue')}</Text>
                                <Title level={2} style={{ margin: '8px 0', fontWeight: 700 }}>{formatCurrency(totalRevenue)}</Title>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Tag 
                                        color={revenueComparison.isIncrease ? 'success' : 'error'} 
                                        icon={revenueComparison.isIncrease ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    >
                                        {revenueComparison.percentage.toFixed(1)}% vs last {revenuePeriod}
                                    </Tag>
                                    <Select
                                        size="small"
                                        value={revenuePeriod}
                                        onChange={setRevenuePeriod}
                                        style={{ width: 85 }}
                                        options={[
                                            { label: 'Day', value: 'day' },
                                            { label: 'Week', value: 'week' },
                                            { label: 'Month', value: 'month' },
                                            { label: 'Year', value: 'year' },
                                        ]}
                                    />
                                </div>
                            </div>
                            <div className="stats-icon" style={{ background: '#e6f4ff', color: '#1677ff' }}>
                                <ShoppingCartOutlined />
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className="stats-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <Text type="secondary" style={{ fontSize: 14 }}>{t('totalProducts')}</Text>
                                <Title level={2} style={{ margin: '8px 0', fontWeight: 700 }}>{totalProducts.toLocaleString()}</Title>
                                <Text type="secondary">Active SKUs in database</Text>
                            </div>
                            <div className="stats-icon" style={{ background: '#f0f0ff', color: '#722ed1' }}>
                                <ShoppingOutlined />
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className="stats-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <Text type="secondary" style={{ fontSize: 14 }}>{t('lowStockItems')}</Text>
                                <Title level={2} style={{ margin: '8px 0', fontWeight: 700, color: '#ef4444' }}>{lowStockCount}</Title>
                                <Text type="danger" strong>Action required</Text> Restock needed
                            </div>
                            <div className="stats-icon" style={{ background: '#fff1f0', color: '#ff4d4f' }}>
                                <BellOutlined />
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card title={<Title level={4} style={{ margin: 0 }}>{t('recentSales')}</Title>}
                extra={<Button type="link" onClick={() => navigate('/reports')}>View All</Button>}
                style={{ borderRadius: 12, border: 'none' }}>
                <Table
                    className="recent-sales-table"
                    columns={columns}
                    dataSource={salesData?.sales || []}
                    pagination={false}
                    rowKey="id"
                />
            </Card>
        </div>
    );
};

export default DashboardPage;
