import React, { useState } from 'react';
import { InputNumber, Button, Space, Card, Typography, Divider, List, Input, Row, Col, Avatar, Tag, message, Skeleton, Empty, Spin, Select } from 'antd';
import {
    DeleteOutlined,
    ShoppingCartOutlined,
    SearchOutlined,
    PlusOutlined,
    MinusOutlined,
    UserAddOutlined,
    RollbackOutlined,
    CloseOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useNavigate, useLocation } from 'react-router-dom';
import SelectCustomerModal from '../components/SelectCustomerModal';
import { useLocalization } from '../context/LocalizationContext';

const { Title, Text } = Typography;

interface ProductItem {
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
}

interface Customer {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    total_orders: number;
    total_spent: string;
}

const NewSalePage: React.FC = () => {
    const [items, setItems] = useState<ProductItem[]>([]);
    const [previousItems, setPreviousItems] = useState<ProductItem[]>([]);
    const [category, setCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const { formatCurrency } = useLocalization();

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

    const { data: productsData, isLoading: productsLoading, isError: productsError } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            try {
                const { data } = await api.get('/products', { params: { limit: 100 } });
                return data.products || [];
            } catch (error) {
                throw error;
            }
        },
        retry: 3,
        retryDelay: 1000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        staleTime: 30000, // 30 seconds
    });

    const saleMutation = useMutation({
        mutationFn: (newSale: any) => api.post('/sales', newSale),
        onSuccess: () => {
            message.success('Sale processed successfully! Redirecting to reports...');
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            // Redirect to reports page instead of sales history
            setTimeout(() => navigate('/reports'), 1000);
        },
        onError: (error: any) => message.error(error.response?.data?.message || 'Error processing sale'),
    });

    const addItem = (product: any) => {
        setPreviousItems(items);
        const existingItem = items.find((item) => item.product_id === product.id);
        if (existingItem) {
            setItems(items.map((item) =>
                item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setItems([...items, { product_id: product.id, name: product.name, price: Number(product.price), quantity: 1, image_url: product.image_url }]);
        }
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) return;
        setPreviousItems(items);
        setItems(items.map((item) => item.product_id === productId ? { ...item, quantity } : item));
    };

    const handleUndo = () => {
        if (previousItems.length > 0 || (previousItems.length === 0 && items.length > 0)) {
            setItems(previousItems);
            setPreviousItems([]);
            message.info('Last action undone');
        }
    };

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    // Check if returning from customers page with new customer
    React.useEffect(() => {
        if (location.state?.from === 'sales') {
            queryClient.invalidateQueries({ queryKey: ['customers-list'] });
        }
    }, [location.state, queryClient]);

    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setShowCustomerModal(false);
    };

    const handleRemoveCustomer = () => {
        setSelectedCustomer(null);
    };

    // Show loading state
    if (productsLoading && !productsData) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <Spin size="large" tip="Loading products..." />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', gap: 24, height: '100vh', overflow: 'hidden' }}>
            {/* Left Section: Product Grid */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, height: '100vh', overflow: 'hidden' }}>
                <HeaderCustom />

                <Row gutter={12}>
                    <Col flex="auto">
                        <Input
                            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                            suffix={<Text type="secondary" style={{ fontSize: 12 }}>⌘ K</Text>}
                            placeholder="Search products (SKU, Name)..."
                            style={{ borderRadius: 8, height: 48 }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col flex="220px">
                        <Select
                            value={category}
                            onChange={(value) => setCategory(value)}
                            style={{ width: '100%', height: 48, borderRadius: 8 }}
                            size="large"
                            options={[
                                { label: 'All Categories', value: 'all' },
                                { label: 'Electronics', value: 'electronics' },
                                { label: 'Clothing', value: 'clothing' },
                                { label: 'Food & Beverage', value: 'food' },
                                { label: 'Home & Garden', value: 'home' },
                                { label: 'Sports', value: 'sports' },
                                { label: 'Books', value: 'books' },
                                { label: 'Toys', value: 'toys' },
                                { label: 'Other', value: 'other' },
                            ]}
                        />
                    </Col>
                </Row>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
                    <Row gutter={[20, 20]}>
                    {productsLoading ? (
                        <>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <Col key={i} xs={24} sm={12} lg={8} xl={6}>
                                    <Skeleton.Button active style={{ width: '100%', height: 220, borderRadius: 12 }} />
                                </Col>
                            ))}
                        </>
                    ) : productsError ? (
                        <Col xs={24}>
                            <Card style={{ borderRadius: 12, textAlign: 'center', padding: 40 }}>
                                <Empty description="Failed to load products" style={{ margin: 0 }} />
                                <Button 
                                    type="primary" 
                                    style={{ marginTop: 16, borderRadius: 8 }} 
                                    onClick={() => window.location.reload()}
                                >
                                    Reload Page
                                </Button>
                            </Card>
                        </Col>
                    ) : !productsData || productsData.length === 0 ? (
                        <Col xs={24}>
                            <Card style={{ borderRadius: 12, textAlign: 'center', padding: 40 }}>
                                <Empty description="No products available" style={{ margin: 0 }} />
                            </Card>
                        </Col>
                    ) : (
                        productsData
                            ?.filter((p: any) => {
                                // Filter by search query
                                const matchesSearch = !searchQuery || 
                                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    p.category?.toLowerCase().includes(searchQuery.toLowerCase());
                                
                                // Filter by category
                                const matchesCategory = category === 'all' || p.category === category;
                                
                                return matchesSearch && matchesCategory;
                            })
                            ?.map((p: any) => (
                            <Col key={p.id} xs={24} sm={12} lg={8} xl={6}>
                                <Card
                                    hoverable
                                    cover={
                                        <div style={{ position: 'relative' }}>
                                            <img
                                                alt={p.name}
                                                src={getImageUrl(p.image_url) || `https://api.dicebear.com/7.x/shapes/svg?seed=${p.id}`}
                                                style={{ height: 160, width: '100%', objectFit: 'cover' }}
                                            />
                                            <Tag color="black" style={{ position: 'absolute', top: 8, right: 8, borderRadius: 4 }}>
                                                {formatCurrency(p.price)}
                                            </Tag>
                                            {p.stock_quantity === 0 && (
                                                <div style={{
                                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                    background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <Tag color="default" style={{ padding: '4px 12px' }}>OUT OF STOCK</Tag>
                                                </div>
                                            )}
                                        </div>
                                    }
                                    onClick={() => p.stock_quantity > 0 && addItem(p)}
                                    style={{ borderRadius: 12, overflow: 'hidden', opacity: p.stock_quantity === 0 ? 0.7 : 1 }}
                                >
                                    <Text strong style={{ display: 'block', fontSize: 15, marginBottom: 8 }}>{p.name}</Text>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <Text type={p.stock_quantity < 10 ? 'danger' : 'success'} style={{ fontSize: 12, fontWeight: 500 }}>
                                                {p.stock_quantity} in stock
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 11 }}>SKU: {p.sku}</Text>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        ))
                    )}
                    </Row>
                </div>
            </div>

            {/* Right Section: Checkout Sidebar */}
            <div style={{ width: 380, background: 'white', borderRadius: 16, display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', height: '100vh', overflow: 'hidden' }}>
                <div style={{ padding: 20, borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text strong style={{ fontSize: 16 }}>CURRENT ORDER #1024</Text>
                        <Button type="text" icon={<DeleteOutlined />} danger onClick={() => setItems([])}>Clear</Button>
                    </div>

                    {/* Customer Selection Section */}
                    {selectedCustomer ? (
                        <div style={{ padding: 12, background: '#f0f7ff', borderRadius: 8, marginBottom: 12, border: '1px solid #b6e4ff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
                                    <Avatar
                                        size={40}
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCustomer.id}`}
                                        style={{ borderRadius: 6 }}
                                    />
                                    <div>
                                        <Text strong style={{ fontSize: 13, display: 'block' }}>
                                            {selectedCustomer.first_name} {selectedCustomer.last_name}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            {selectedCustomer.email}
                                        </Text>
                                    </div>
                                </div>
                                <Button
                                    type="text"
                                    icon={<CloseOutlined />}
                                    size="small"
                                    onClick={handleRemoveCustomer}
                                    style={{ color: '#ff4d4f' }}
                                />
                            </div>
                        </div>
                    ) : (
                        <Button
                            icon={<UserAddOutlined />}
                            block
                            onClick={() => setShowCustomerModal(true)}
                            style={{ height: 40, borderRadius: 8, textAlign: 'left', color: '#6b7280' }}
                        >
                            Add customer to sale...
                        </Button>
                    )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', minHeight: 0 }}>
                    <List
                        dataSource={items}
                        locale={{ emptyText: <Empty description="No items in cart" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '40px 0' }} /> }}
                        renderItem={(item) => (
                            <List.Item style={{ padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}>
                                <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                                    <Avatar shape="square" size={48} src={getImageUrl(item.image_url) || `https://api.dicebear.com/7.x/shapes/svg?seed=${item.product_id}`} style={{ borderRadius: 6 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Text strong>{item.name}</Text>
                                            <Text strong>{formatCurrency(item.price * item.quantity)}</Text>
                                        </div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{formatCurrency(item.price)} / unit</Text>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                                            <Space size={0} style={{ background: '#f8f9fa', borderRadius: 6, padding: 2 }}>
                                                <Button type="text" size="small" icon={<MinusOutlined />} onClick={() => updateQuantity(item.product_id, item.quantity - 1)} />
                                                <InputNumber
                                                    min={1}
                                                    value={item.quantity}
                                                    bordered={false}
                                                    controls={false}
                                                    style={{ width: 40, textAlign: 'center' }}
                                                />
                                                <Button type="text" size="small" icon={<PlusOutlined />} onClick={() => updateQuantity(item.product_id, item.quantity + 1)} />
                                            </Space>
                                        </div>
                                    </div>
                                </div>
                            </List.Item>
                        )}
                    />
                </div>

                <div style={{ padding: 20, background: '#fcfcfc', borderTop: '1px solid #f3f4f6', borderRadius: '0 0 16px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text type="secondary">Subtotal</Text>
                            <Text strong>{formatCurrency(subtotal)}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text type="secondary">Tax (8%)</Text>
                            <Text strong>{formatCurrency(tax)}</Text>
                        </div>
                        <Divider style={{ margin: '8px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Title level={4} style={{ margin: 0 }}>Total</Title>
                            <Title level={2} style={{ margin: 0, color: '#1677ff' }}>{formatCurrency(total)}</Title>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <Button 
                            size="large" 
                            icon={<RollbackOutlined />} 
                            style={{ width: 80, height: 56, borderRadius: 12 }}
                            onClick={handleUndo}
                            disabled={items.length === 0 && previousItems.length === 0}
                            title="Undo last action"
                        />
                        <Button
                            type="primary"
                            size="large"
                            block
                            style={{ height: 56, borderRadius: 12, fontSize: 18, fontWeight: 700 }}
                            onClick={() => {
                                if (items.length === 0) {
                                    message.warning('Please add at least one item');
                                    return;
                                }
                                const saleData: any = {
                                    items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
                                };
                                // Include customer if selected (optional)
                                if (selectedCustomer?.id) {
                                    saleData.customer_id = selectedCustomer.id;
                                }
                                saleMutation.mutate(saleData);
                            }}
                            loading={saleMutation.isPending}
                            disabled={items.length === 0}
                        >
                            Checkout <ShoppingCartOutlined />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Customer Selection Modal */}
            <SelectCustomerModal
                visible={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onSelect={handleSelectCustomer}
                selectedCustomerId={selectedCustomer?.id}
            />
        </div>
    );
};

const HeaderCustom = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="posbuzz-logo">
            <div className="posbuzz-logo-icon">
                <ShoppingCartOutlined />
            </div>
            <span>PosBuzz</span>
        </div>
    </div>
);

export default NewSalePage;
