import React, { useState, useRef } from 'react';
import { Table, Button, Input, Space, Modal, Form, InputNumber, message, Popconfirm, Tag, Select, Typography, Card, Avatar, Row, Col, Image as AntImage, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, CameraOutlined, LoadingOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useLocalization } from '../context/LocalizationContext';

const { Title, Text } = Typography;

const ProductsPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [form] = Form.useForm();
    const queryClient = useQueryClient();
    const { formatCurrency } = useLocalization();
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [previewImage, setPreviewImage] = useState<string>('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Category label mapper
    const getCategoryLabel = (category: string) => {
        const categoryMap: Record<string, string> = {
            'electronics': 'Electronics',
            'clothing': 'Clothing',
            'food': 'Food & Beverage',
            'home': 'Home & Garden',
            'sports': 'Sports',
            'books': 'Books',
            'toys': 'Toys',
            'other': 'Other',
        };
        return categoryMap[category] || category || 'Other';
    };

    const { data, isLoading } = useQuery({
        queryKey: ['products', searchText, selectedCategory, page, pageSize],
        queryFn: async () => {
            const params: any = { 
                search: searchText, 
                page, 
                limit: pageSize 
            };
            if (selectedCategory !== 'all') {
                params.category = selectedCategory;
            }
            const { data } = await api.get('/products', { params });
            return data;
        },
        staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    });

    const createMutation = useMutation({
        mutationFn: (newProduct: any) => api.post('/products', newProduct),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            message.success('Product created successfully');
            setIsModalOpen(false);
            form.resetFields();
            setPreviewImage('');
        },
        onError: (error: any) => message.error(error.response?.data?.message || 'Error creating product'),
    });

    const updateMutation = useMutation({
        mutationFn: (product: any) => api.put(`/products/${product.id}`, product),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            message.success('Product updated successfully');
            setIsModalOpen(false);
            setEditingProduct(null);
            form.resetFields();
            setPreviewImage('');
        },
        onError: (error: any) => message.error(error.response?.data?.message || 'Error updating product'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/products/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            message.success('Product deleted successfully');
        },
        onError: () => message.error('Error deleting product'),
    });

    const handleEdit = (record: any) => {
        setEditingProduct(record);
        form.setFieldsValue(record);
        // Show existing image from backend if editing
        if (record.image_url) {
            const imageUrl = getImageUrl(record.image_url);
            setPreviewImage(imageUrl || '');
            setCurrentImageUrl(record.image_url);
        } else {
            setPreviewImage('');
            setCurrentImageUrl('');
        }
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingProduct(null);
        form.resetFields();
        setPreviewImage('');
        setCurrentImageUrl('');
        setIsModalOpen(true);
    };

    const handleRefresh = () => {
        setSearchText('');
        setSelectedCategory('all');
        setPage(1);
        queryClient.invalidateQueries({ queryKey: ['products'] });
        message.success('Filters reset and data refreshed');
    };

    const onFinish = (values: any) => {
        const productData = {
            ...values,
            price: parseFloat(values.price),
            stock_quantity: parseInt(values.stock_quantity),
            image_url: currentImageUrl || undefined,
        };

        if (editingProduct) {
            updateMutation.mutate({ ...productData, id: editingProduct.id });
        } else {
            createMutation.mutate(productData);
        }
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

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

        const previewUrl = URL.createObjectURL(file);
        setPreviewImage(previewUrl);

        setUploadingImage(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/uploads/product', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                const imageUrl = response.data.imageUrl;
                setCurrentImageUrl(imageUrl);
                setPreviewImage(imageUrl); // Base64 data URI can be used directly
                message.success('Image uploaded successfully!');
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to upload image');
            URL.revokeObjectURL(previewUrl);
            setPreviewImage('');
            setCurrentImageUrl('');
        } finally {
            setUploadingImage(false);
        }
    };

    const columns = [
        {
            title: 'PRODUCT NAME',
            key: 'name',
            render: (_: any, record: any) => {
                return (
                    <Space>
                        <Avatar
                            shape="square"
                            size={40}
                            src={getImageUrl(record.image_url) || `https://api.dicebear.com/7.x/shapes/svg?seed=${record.id}`}
                            style={{ borderRadius: 6 }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <Text strong>{record.name}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>{getCategoryLabel(record.category)}</Text>
                        </div>
                    </Space>
                );
            }
        },
        {
            title: 'SKU',
            dataIndex: 'sku',
            key: 'sku',
            render: (sku: string) => <Text style={{ color: '#1677ff' }}>{sku}</Text>
        },
        {
            title: 'PRICE',
            dataIndex: 'price',
            key: 'price',
            render: (val: any) => <Text strong>{formatCurrency(parseFloat(val))}</Text>
        },
        {
            title: 'STOCK',
            dataIndex: 'stock_quantity',
            key: 'stock',
            render: (val: any) => {
                let color = 'success';
                let label = `${val} Units`;
                if (val === 0) {
                    color = 'error';
                    label = 'Out of Stock';
                } else if (val < 20) {
                    color = 'warning';
                }
                return <Tag color={color} style={{ borderRadius: 12 }}>{label}</Tag>;
            }
        },
        {
            title: 'ACTIONS',
            key: 'action',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Button type="text" icon={<EditOutlined style={{ color: '#6b7280' }} />} onClick={() => handleEdit(record)} />
                    <Popconfirm title="Delete product?" onConfirm={() => deleteMutation.mutate(record.id)}>
                        <Button type="text" icon={<DeleteOutlined style={{ color: '#ef4444' }} />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Product Inventory</Title>
                    <Text type="secondary">Manage your product catalog, prices, and stock availability.</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew}>Add Product</Button>
            </div>

            <Card style={{ borderRadius: 12, border: 'none', marginBottom: 24 }}>
                <Row gutter={16}>
                    <Col span={14}>
                        <Input
                            placeholder="Search by Name or SKU..."
                            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                            style={{ borderRadius: 8, height: 40 }}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </Col>
                    <Col span={8}>
                        <Select 
                            placeholder="All Categories" 
                            style={{ width: '100%', height: 40, borderRadius: 8 }} 
                            value={selectedCategory}
                            onChange={(value) => {
                                setSelectedCategory(value);
                                setPage(1);
                            }}
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
                    <Col span={2}>
                        <Button 
                            icon={<ReloadOutlined />} 
                            block 
                            style={{ borderRadius: 8, height: 40 }} 
                            onClick={handleRefresh}
                        />
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={data?.products}
                    loading={isLoading}
                    rowKey="id"
                    style={{ marginTop: 24 }}
                    pagination={{
                        current: page,
                        pageSize: pageSize,
                        total: data?.total || 0,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        onChange: (newPage, newPageSize) => {
                            setPage(newPage);
                            if (newPageSize !== pageSize) {
                                setPageSize(newPageSize);
                                setPage(1); // Reset to first page when page size changes
                            }
                        },
                        showTotal: (total) => `Total ${total} products`,
                    }}
                />
            </Card>

            {/* Add/Edit Product Modal */}
            <Modal
                title={editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setEditingProduct(null);
                    setPreviewImage('');
                    setCurrentImageUrl('');
                    form.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    {/* Product Image */}
                    <Form.Item label={<Text strong>Product Image</Text>}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '24px',
                                border: '2px dashed #d9d9d9',
                                borderRadius: '8px',
                                cursor: uploadingImage ? 'not-allowed' : 'pointer',
                                background: '#fafafa',
                                transition: 'all 0.3s ease',
                                opacity: uploadingImage ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!uploadingImage) {
                                    (e.currentTarget as HTMLElement).style.borderColor = '#1677ff';
                                    (e.currentTarget as HTMLElement).style.background = '#f6f8ff';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!uploadingImage) {
                                    (e.currentTarget as HTMLElement).style.borderColor = '#d9d9d9';
                                    (e.currentTarget as HTMLElement).style.background = '#fafafa';
                                }
                            }}
                            onClick={() => {
                                if (!uploadingImage) {
                                    fileInputRef.current?.click();
                                }
                            }}
                        >
                            {uploadingImage ? (
                                <div style={{ textAlign: 'center' }}>
                                    <Spin indicator={<LoadingOutlined style={{ fontSize: '32px', color: '#1677ff' }} />} />
                                    <Text style={{ display: 'block', marginTop: '12px' }}>Uploading image...</Text>
                                </div>
                            ) : previewImage ? (
                                <div style={{ textAlign: 'center' }}>
                                    <AntImage
                                        src={previewImage}
                                        alt="Preview"
                                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                                        preview={true}
                                    />
                                    <Text type="secondary" style={{ display: 'block', marginTop: '12px', fontSize: '12px' }}>
                                        Click to change image
                                    </Text>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center' }}>
                                    <CameraOutlined style={{ fontSize: '32px', color: '#1677ff', marginBottom: '12px' }} />
                                    <Text strong style={{ display: 'block' }}>Upload Product Image</Text>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>PNG, JPG or GIF (Max 5MB)</Text>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleImageChange}
                            />
                        </div>
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        {/* Product Name */}
                        <Form.Item
                            label={<Text strong>Product Name</Text>}
                            name="name"
                            rules={[{ required: true, message: 'Please enter product name!' }]}
                        >
                            <Input placeholder="e.g. Coffee" style={{ borderRadius: '8px', height: '40px' }} />
                        </Form.Item>

                        {/* Category */}
                        <Form.Item
                            label={<Text strong>Category</Text>}
                            name="category"
                            initialValue="other"
                            rules={[{ required: true, message: 'Please select a category' }]}
                        >
                            <Select
                                placeholder="Select category"
                                style={{ borderRadius: '8px' }}
                                options={[
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
                        </Form.Item>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        {/* SKU */}
                        <Form.Item
                            label={<Text strong>SKU</Text>}
                            name="sku"
                            rules={[{ required: true, message: 'Please enter SKU!' }]}
                        >
                            <Input placeholder="e.g. COF-001" style={{ borderRadius: '8px', height: '40px' }} />
                        </Form.Item>

                        {/* Price */}
                        <Form.Item
                            label={<Text strong>Price</Text>}
                            name="price"
                            rules={[{ required: true, message: 'Please enter price!' }]}
                        >
                            <InputNumber
                                min={0}
                                step={0.01}
                                style={{ width: '100%', borderRadius: '8px', height: '40px' }}
                                placeholder="0.00"
                            />
                        </Form.Item>
                    </div>

                    {/* Stock Quantity */}
                    <Form.Item
                        label={<Text strong>Stock Quantity</Text>}
                        name="stock_quantity"
                        rules={[{ required: true, message: 'Please enter stock quantity!' }]}
                    >
                        <InputNumber
                            min={0}
                            style={{ width: '100%', borderRadius: '8px', height: '40px' }}
                            placeholder="0"
                        />
                    </Form.Item>

                    {/* Form Actions */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <Button
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditingProduct(null);
                                setPreviewImage('');
                                form.resetFields();
                            }}
                            style={{ borderRadius: '8px', height: '40px', flex: 1 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={createMutation.isPending || updateMutation.isPending}
                            style={{ borderRadius: '8px', height: '40px', flex: 1 }}
                        >
                            {editingProduct ? '💾 Update Product' : '➕ Add Product'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default ProductsPage;
