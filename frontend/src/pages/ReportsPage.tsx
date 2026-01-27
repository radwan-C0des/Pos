import React, { useState } from 'react';
import {
    Card,
    Row,
    Col,
    Typography,
    Table,
    Tag,
    Button,
    Space,
    DatePicker,
    Statistic,
    Empty,
    Modal,
    List,
    Avatar,
    Badge,
    Input,
    Select,
    message,
} from 'antd';
import {
    ReloadOutlined,
    DollarOutlined,
    ShoppingCartOutlined,
    SearchOutlined,
    FilePdfOutlined,
    BarChartOutlined,
    UnorderedListOutlined,
    AppstoreOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import dayjs from 'dayjs';
import { useLocalization } from '../context/LocalizationContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ReportsPage: React.FC = () => {
    const [dates, setDates] = useState<any>(null);
    const [searchText, setSearchText] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [pdfModalVisible, setPdfModalVisible] = useState(false);
    const [pdfDateRange, setPdfDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
    const [customDateRange, setCustomDateRange] = useState<any>(null);
    const { formatCurrency, preferences } = useLocalization();

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['sales', dates, searchText],
        queryFn: async () => {
            const params: any = { limit: 1000 };
            if (dates) {
                params.startDate = dates[0].toISOString();
                params.endDate = dates[1].toISOString();
            }
            const { data } = await api.get('/sales', { params });
            return data;
        },
    });

    // Filter sales based on search text
    const filteredSales = data?.sales?.filter((sale: any) => {
        const searchLower = searchText.toLowerCase();
        return (
            sale.id.toLowerCase().includes(searchLower) ||
            sale.user?.email?.toLowerCase().includes(searchLower) ||
            sale.sale_items?.some((item: any) =>
                item.product?.name?.toLowerCase().includes(searchLower)
            )
        );
    }) || [];

    // Calculate statistics
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((acc: number, sale: any) => acc + Number(sale.total_amount), 0);
    const avgTransactionValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    const totalItems = filteredSales.reduce((acc: number, sale: any) => 
        acc + (sale.sale_items?.reduce((itemAcc: number, item: any) => itemAcc + item.quantity, 0) || 0), 0
    );

    // Get product sales summary
    const productSummary: any = {};
    filteredSales.forEach((sale: any) => {
        sale.sale_items?.forEach((item: any) => {
            if (!productSummary[item.product?.name]) {
                productSummary[item.product?.name] = {
                    name: item.product?.name,
                    totalQuantity: 0,
                    totalRevenue: 0,
                    price: Number(item.unit_price),
                };
            }
            productSummary[item.product?.name].totalQuantity += item.quantity;
            productSummary[item.product?.name].totalRevenue += Number(item.unit_price) * item.quantity;
        });
    });

    const salesColumns = [
        {
            title: 'TRANSACTION ID',
            dataIndex: 'id',
            key: 'id',
            width: 120,
            render: (id: string) => (
                <Text strong style={{ color: '#1677ff' }}>
                    #{id.slice(0, 8).toUpperCase()}
                </Text>
            ),
        },
        {
            title: 'DATE & TIME',
            dataIndex: 'created_at',
            key: 'date',
            render: (date: string) => (
                <Space direction="vertical" size={0}>
                    <Text>{dayjs(date).format('MMM DD, YYYY')}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(date).format('HH:mm:ss')}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'ITEMS',
            key: 'items',
            render: (_: any, record: any) => {
                const itemCount = record.sale_items?.length || 0;
                const totalQty = record.sale_items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
                return (
                    <Space>
                        <Badge count={itemCount} showZero color="#1677ff" />
                        <Text type="secondary">({totalQty} units)</Text>
                    </Space>
                );
            },
        },
        {
            title: 'AMOUNT',
            dataIndex: 'total_amount',
            key: 'total_amount',
            render: (val: any) => (
                <Text strong style={{ fontSize: 14 }}>
                    {formatCurrency(Number(val))}
                </Text>
            ),
        },
        {
            title: 'ACTION',
            key: 'action',
            render: (_: any, record: any) => (
                <Button
                    type="text"
                    size="small"
                    onClick={() => {
                        setSelectedSale(record);
                        setModalVisible(true);
                    }}
                >
                    View Details
                </Button>
            ),
        },
    ];

    const productColumns = [
        {
            title: 'PRODUCT NAME',
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => <Text strong>{name}</Text>,
        },
        {
            title: 'PRICE',
            dataIndex: 'price',
            key: 'price',
            render: (price: number) => <Text>{formatCurrency(price)}</Text>,
        },
        {
            title: 'QUANTITY SOLD',
            dataIndex: 'totalQuantity',
            key: 'quantity',
            render: (qty: number) => (
                <Tag color="blue" style={{ fontSize: 12 }}>
                    {qty} units
                </Tag>
            ),
        },
        {
            title: 'TOTAL REVENUE',
            dataIndex: 'totalRevenue',
            key: 'revenue',
            render: (revenue: number) => <Text strong>{formatCurrency(revenue)}</Text>,
        },
    ];

    // PDF-safe currency formatter that uses plain ASCII characters
    const formatCurrencyForPDF = (amount: number): string => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        
        // Get currency code from preferences
        const currencyCode = preferences?.currency || 'USD';
        
        // Use plain text currency codes instead of symbols for PDF compatibility
        const currencyNames: Record<string, string> = {
            USD: 'USD',
            EUR: 'EUR',
            GBP: 'GBP',
            INR: 'INR',
            BDT: 'BDT',
        };

        const currency = currencyNames[currencyCode] || 'USD';
        
        // Format: USD 123.45
        return `${currency} ${numAmount.toFixed(2)}`;
    };

    function handlePdfExport() {
        // Calculate date range based on selection
        let startDate: dayjs.Dayjs;
        let endDate: dayjs.Dayjs = dayjs();

        switch (pdfDateRange) {
            case 'today':
                startDate = dayjs().startOf('day');
                break;
            case 'week':
                startDate = dayjs().subtract(7, 'days');
                break;
            case 'month':
                startDate = dayjs().subtract(30, 'days');
                break;
            case 'year':
                startDate = dayjs().subtract(1, 'year');
                break;
            case 'custom':
                if (!customDateRange || !customDateRange[0] || !customDateRange[1]) {
                    message.error('Please select a custom date range');
                    return;
                }
                startDate = customDateRange[0];
                endDate = customDateRange[1];
                break;
            default:
                startDate = dayjs().subtract(30, 'days');
        }

        // Filter sales data by date range
        const salesInRange = filteredSales?.filter((sale: any) => {
            const saleDate = dayjs(sale.created_at);
            return saleDate.isAfter(startDate) && saleDate.isBefore(endDate);
        }) || [];

        if (salesInRange.length === 0) {
            message.warning('No sales data found for the selected period');
            return;
        }

        // Generate PDF
        const doc = new jsPDF();
        
        // Add header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Sales Report', 14, 20);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Period: ${startDate.format('MMM DD, YYYY')} - ${endDate.format('MMM DD, YYYY')}`, 14, 28);
        doc.text(`Generated: ${dayjs().format('MMM DD, YYYY HH:mm')}`, 14, 34);
        
        // Summary section
        const totalSales = salesInRange.length;
        const totalRevenue = salesInRange.reduce((sum: number, sale: any) => sum + Number(sale.total_amount), 0);
        const totalItems = salesInRange.reduce((sum: number, sale: any) => 
            sum + (sale.sale_items?.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) || 0), 0
        );

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', 14, 45);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Sales: ${totalSales}`, 14, 52);
        doc.text(`Total Revenue: ${formatCurrencyForPDF(totalRevenue)}`, 14, 58);
        doc.text(`Total Items Sold: ${totalItems}`, 14, 64);

        // Sales transactions table
        const tableData = salesInRange.map((sale: any) => [
            sale.id.substring(0, 8),
            dayjs(sale.created_at).format('MMM DD, YYYY HH:mm'),
            sale.customer ? `${sale.customer.first_name} ${sale.customer.last_name}` : 'Walk-in',
            sale.sale_items?.length || 0,
            formatCurrencyForPDF(Number(sale.total_amount)),
        ]);

        autoTable(doc, {
            startY: 72,
            head: [['Transaction ID', 'Date', 'Customer', 'Items', 'Amount']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [22, 119, 255] },
            styles: { fontSize: 9 },
        });

        // Product summary
        const productSummary: any = {};
        salesInRange.forEach((sale: any) => {
            sale.sale_items?.forEach((item: any) => {
                const productName = item.product?.name || 'Unknown';
                if (!productSummary[productName]) {
                    productSummary[productName] = {
                        quantity: 0,
                        revenue: 0,
                    };
                }
                productSummary[productName].quantity += item.quantity;
                productSummary[productName].revenue += Number(item.unit_price) * item.quantity;
            });
        });

        const productData = Object.keys(productSummary).map(name => [
            name,
            productSummary[name].quantity,
            formatCurrencyForPDF(productSummary[name].revenue / productSummary[name].quantity),
            formatCurrencyForPDF(productSummary[name].revenue),
        ]);

        const finalY = (doc as any).lastAutoTable.finalY || 72;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Product Summary', 14, finalY + 15);

        autoTable(doc, {
            startY: finalY + 20,
            head: [['Product', 'Qty Sold', 'Avg Price', 'Total Revenue']],
            body: productData,
            theme: 'striped',
            headStyles: { fillColor: [22, 119, 255] },
            styles: { fontSize: 9 },
        });

        // Save PDF
        const fileName = `sales-report-${startDate.format('YYYY-MM-DD')}-to-${endDate.format('YYYY-MM-DD')}.pdf`;
        doc.save(fileName);
        
        message.success('PDF report generated successfully!');
        setPdfModalVisible(false);
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ marginBottom: 16, flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                        <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
                            <BarChartOutlined style={{ marginRight: 8 }} />
                            Sales Reports
                        </Title>
                        <Text type="secondary">View and analyze all completed sales transactions</Text>
                    </div>
                    <Space>
                        <Button 
                            icon={<FilePdfOutlined />}
                            type="primary"
                            onClick={() => setPdfModalVisible(true)}
                        >
                            Export PDF
                        </Button>
                    </Space>
                </div>
            </div>

            {/* Statistics Cards */}
            <Row gutter={16} style={{ marginBottom: 16, flexShrink: 0 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        hoverable
                        style={{
                            borderRadius: 12,
                            border: 'none',
                            background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
                            color: 'white',
                        }}
                    >
                        <Statistic
                            title={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>Total Sales</Text>}
                            value={totalSales}
                            prefix={<ShoppingCartOutlined />}
                            valueStyle={{ color: '#fff', fontSize: 24, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        hoverable
                        style={{
                            borderRadius: 12,
                            border: 'none',
                            background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                            color: 'white',
                        }}
                    >
                        <Statistic
                            title={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>Total Revenue</Text>}
                            value={totalRevenue}
                            prefix={<DollarOutlined />}
                            suffix=""
                            valueStyle={{ color: '#fff', fontSize: 24, fontWeight: 700 }}
                            formatter={(value) => `$${Number(value).toFixed(2)}`}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        hoverable
                        style={{
                            borderRadius: 12,
                            border: 'none',
                            background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
                            color: 'white',
                        }}
                    >
                        <Statistic
                            title={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>Avg Value</Text>}
                            value={avgTransactionValue}
                            suffix=""
                            valueStyle={{ color: '#fff', fontSize: 24, fontWeight: 700 }}
                            formatter={(value) => `$${Number(value).toFixed(2)}`}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        hoverable
                        style={{
                            borderRadius: 12,
                            border: 'none',
                            background: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
                            color: 'white',
                        }}
                    >
                        <Statistic
                            title={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>Items Sold</Text>}
                            value={totalItems}
                            valueStyle={{ color: '#fff', fontSize: 24, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <Card style={{ marginBottom: 16, borderRadius: 12, border: 'none', flexShrink: 0 }}>
                <Row gutter={16}>
                    <Col xs={24} sm={12} lg={12}>
                        <Input
                            placeholder="Search by transaction ID, seller, or product..."
                            prefix={<SearchOutlined />}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ borderRadius: 8 }}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={12}>
                        <RangePicker
                            style={{ width: '100%', borderRadius: 8 }}
                            onChange={(v) => setDates(v)}
                            format="MMM DD, YYYY"
                        />
                    </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col>
                        <Button
                            type="primary"
                            onClick={() => refetch()}
                            loading={isLoading}
                            icon={<ReloadOutlined />}
                        >
                            Refresh
                        </Button>
                    </Col>
                    <Col>
                        <Button
                            onClick={() => {
                                setDates(null);
                                setSearchText('');
                            }}
                        >
                            Clear Filters
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* Tables Section - Scrollable Container */}
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
                {/* Sales Transactions Table */}
                <Card style={{ borderRadius: 12, border: 'none', flexShrink: 0 }}>
                    <Title level={4} style={{ marginBottom: 16 }}>
                        <UnorderedListOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                        Recent Transactions
                    </Title>
                    {filteredSales.length === 0 ? (
                        <Empty description="No sales found" />
                    ) : (
                        <Table
                            columns={salesColumns}
                            dataSource={filteredSales}
                            loading={isLoading}
                            rowKey="id"
                            pagination={{
                                pageSize: 5,
                                showSizeChanger: true,
                                pageSizeOptions: ['5', '10', '20'],
                                showTotal: (total) => `Total ${total} transactions`,
                            }}
                            scroll={{ x: 800 }}
                        />
                    )}
                </Card>

                {/* Product Sales Summary */}
                <Card style={{ borderRadius: 12, border: 'none', flexShrink: 0 }}>
                    <Title level={4} style={{ marginBottom: 16 }}>
                        <AppstoreOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                        Product Sales Summary
                    </Title>
                    {Object.keys(productSummary).length === 0 ? (
                        <Empty description="No products sold" />
                    ) : (
                        <Table
                            columns={productColumns}
                            dataSource={Object.values(productSummary)}
                            rowKey="name"
                            pagination={{
                                pageSize: 5,
                                showSizeChanger: true,
                                pageSizeOptions: ['5', '10', '20'],
                                showTotal: (total) => `Total ${total} products`,
                            }}
                            scroll={{ x: 600 }}
                        />
                    )}
                </Card>
            </div>

            {/* Sale Details Modal */}
            <Modal
                title={
                    <div>
                        <Text strong style={{ fontSize: 18 }}>Sale Details #{selectedSale?.id?.slice(0, 8).toUpperCase()}</Text>
                    </div>
                }
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={800}
            >
                {selectedSale && (
                    <div>
                        <Row gutter={16} style={{ marginBottom: 24 }}>
                            <Col span={8}>
                                <div style={{ padding: 16, background: '#f0f5ff', borderRadius: 8 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Transaction ID</Text>
                                    <br />
                                    <Text strong style={{ fontSize: 13, fontFamily: 'monospace' }}>
                                        {selectedSale.id.substring(0, 8)}...
                                    </Text>
                                </div>
                            </Col>
                            <Col span={8}>
                                <div style={{ padding: 16, background: '#f6ffed', borderRadius: 8 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Transaction Date</Text>
                                    <br />
                                    <Text strong style={{ fontSize: 13 }}>
                                        {dayjs(selectedSale.created_at).format('MMM DD, YYYY HH:mm')}
                                    </Text>
                                </div>
                            </Col>
                            <Col span={8}>
                                <div style={{ padding: 16, background: '#fff7e6', borderRadius: 8 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Customer</Text>
                                    <br />
                                    <Text strong style={{ fontSize: 13 }}>
                                        {selectedSale.customer 
                                            ? `${selectedSale.customer.first_name} ${selectedSale.customer.last_name}`
                                            : 'Walk-in Customer'
                                        }
                                    </Text>
                                </div>
                            </Col>
                        </Row>

                        <div style={{ marginBottom: 16 }}>
                            <Text strong style={{ fontSize: 16 }}>
                                Items Purchased
                            </Text>
                        </div>
                        <List
                            dataSource={selectedSale.sale_items}
                            style={{ marginBottom: 24 }}
                            renderItem={(item: any, index: number) => {
                                const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                                const itemTotal = Number(item.unit_price) * item.quantity;
                                return (
                                    <List.Item style={{ 
                                        padding: '16px', 
                                        background: index % 2 === 0 ? '#fafafa' : 'white',
                                        borderRadius: 8,
                                        marginBottom: 8
                                    }}>
                                        <div style={{ display: 'flex', width: '100%', gap: 16, alignItems: 'center' }}>
                                            <Avatar 
                                                shape="square" 
                                                size={64}
                                                src={item.product?.image_url ? `${apiBaseUrl}${item.product.image_url}` : undefined}
                                                style={{ backgroundColor: item.product?.image_url ? 'transparent' : '#1677ff', borderRadius: 8 }}
                                            >
                                                {!item.product?.image_url && '📦'}
                                            </Avatar>
                                            <div style={{ flex: 1 }}>
                                                <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>
                                                    {item.product?.name || 'Unknown Product'}
                                                </Text>
                                                <Space size="large">
                                                    <div>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>Unit Price</Text>
                                                        <br />
                                                        <Text strong style={{ fontSize: 14 }}>{formatCurrency(Number(item.unit_price))}</Text>
                                                    </div>
                                                    <div>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>Quantity</Text>
                                                        <br />
                                                        <Tag color="blue" style={{ fontSize: 13, padding: '2px 12px' }}>×{item.quantity}</Tag>
                                                    </div>
                                                    <div>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>Subtotal</Text>
                                                        <br />
                                                        <Text strong style={{ fontSize: 15, color: '#52c41a' }}>
                                                            {formatCurrency(itemTotal)}
                                                        </Text>
                                                    </div>
                                                </Space>
                                            </div>
                                        </div>
                                    </List.Item>
                                );
                            }}
                        />

                        {/* Order Summary */}
                        <div style={{ 
                            padding: 20, 
                            background: '#f0f5ff', 
                            borderRadius: 12,
                            border: '2px solid #d6e4ff'
                        }}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Text type="secondary">Total Items</Text>
                                    <br />
                                    <Text strong style={{ fontSize: 16 }}>
                                        {selectedSale.sale_items.reduce((sum: number, item: any) => sum + item.quantity, 0)} items
                                    </Text>
                                </Col>
                                <Col span={12} style={{ textAlign: 'right' }}>
                                    <Text type="secondary">Total Amount</Text>
                                    <br />
                                    <Text strong style={{ fontSize: 20, color: '#1677ff' }}>
                                        {formatCurrency(Number(selectedSale.total_amount))}
                                    </Text>
                                </Col>
                            </Row>
                        </div>
                    </div>
                )}
            </Modal>

            {/* PDF Export Modal */}
            <Modal
                title={<Text strong style={{ fontSize: 18 }}>Export Sales Report</Text>}
                open={pdfModalVisible}
                onCancel={() => setPdfModalVisible(false)}
                onOk={handlePdfExport}
                okText="Generate PDF"
                cancelText="Cancel"
                width={500}
            >
                <div style={{ padding: '16px 0' }}>
                    <Text strong style={{ display: 'block', marginBottom: 12 }}>Select Date Range:</Text>
                    <Select
                        style={{ width: '100%', marginBottom: 16 }}
                        value={pdfDateRange}
                        onChange={(value) => setPdfDateRange(value)}
                        options={[
                            { label: 'Today', value: 'today' },
                            { label: 'Last 7 Days', value: 'week' },
                            { label: 'Last 30 Days', value: 'month' },
                            { label: 'Last Year', value: 'year' },
                            { label: 'Custom Range', value: 'custom' },
                        ]}
                    />
                    
                    {pdfDateRange === 'custom' && (
                        <RangePicker
                            style={{ width: '100%' }}
                            value={customDateRange}
                            onChange={(dates) => setCustomDateRange(dates)}
                            format="YYYY-MM-DD"
                        />
                    )}

                    <div style={{ marginTop: 16, padding: 12, background: '#f0f5ff', borderRadius: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            The PDF will include all sales transactions, product details, and revenue summary for the selected period.
                        </Text>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ReportsPage;
