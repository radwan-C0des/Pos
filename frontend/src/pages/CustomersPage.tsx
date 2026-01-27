import React, { useState } from 'react';
import { Table, Button, Space, Input, Avatar, Tag, Row, Col, Card, Statistic, Modal, message, Descriptions, Spin } from 'antd';
import { UserAddOutlined, DeleteOutlined, SearchOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLocalization } from '../context/LocalizationContext';

dayjs.extend(relativeTime);

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  total_orders: number;
  total_spent: number;
  last_visit: string;
  created_at: string;
}

const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatCurrency, preferences } = useLocalization();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', page, pageSize, search],
    queryFn: async () => {
      const { data } = await api.get('/customers', {
        params: { page, limit: pageSize, search },
      });
      return data;
    },
  });

  // Fetch customer details with purchase history
  const { data: customerDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['customer-details', selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return null;
      const { data } = await api.get(`/customers/${selectedCustomerId}`);
      return data;
    },
    enabled: !!selectedCustomerId,
  });

  const deleteMutation = useMutation({
    mutationFn: (customerId: string) => api.delete(`/customers/${customerId}`),
    onSuccess: () => {
      message.success('Customer deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => message.error(error.response?.data?.message || 'Error deleting customer'),
  });

  const handleDelete = (customerId: string) => {
    Modal.confirm({
      title: 'Delete Customer',
      content: 'Are you sure you want to delete this customer?',
      okText: 'Delete',
      okType: 'danger',
      onOk() {
        deleteMutation.mutate(customerId);
      },
    });
  };

  const handleViewHistory = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setHistoryModalVisible(true);
  };

  const handleCloseModal = () => {
    setHistoryModalVisible(false);
    setSelectedCustomerId(null);
  };

  // PDF-safe currency formatter
  const formatCurrencyForPDF = (amount: number): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const currencyCode = preferences?.currency || 'USD';
    const currencyNames: Record<string, string> = {
      USD: 'USD',
      EUR: 'EUR',
      GBP: 'GBP',
      INR: 'INR',
      BDT: 'BDT',
    };
    const currency = currencyNames[currencyCode] || 'USD';
    return `${currency} ${numAmount.toFixed(2)}`;
  };

  const handleExportCustomerPDF = () => {
    if (!customerDetails) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Purchase History', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Customer: ${customerDetails.first_name} ${customerDetails.last_name}`, 14, 28);
    doc.text(`Email: ${customerDetails.email}`, 14, 34);
    doc.text(`Phone: ${customerDetails.phone}`, 14, 40);
    doc.text(`Generated: ${dayjs().format('MMM DD, YYYY HH:mm')}`, 14, 46);

    // Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, 57);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Orders: ${customerDetails.total_orders || 0}`, 14, 64);
    doc.text(`Total Spent: ${formatCurrencyForPDF(customerDetails.total_spent || 0)}`, 14, 70);
    doc.text(`Last Visit: ${customerDetails.last_visit ? dayjs(customerDetails.last_visit).format('MMM DD, YYYY') : 'Never'}`, 14, 76);

    // Purchase history table
    if (customerDetails.sales && customerDetails.sales.length > 0) {
      const tableData: any[] = [];

      customerDetails.sales.forEach((sale: any) => {
        sale.sale_items?.forEach((item: any) => {
          tableData.push([
            dayjs(sale.created_at).format('MMM DD, YYYY'),
            item.product?.name || 'Unknown',
            item.quantity,
            formatCurrencyForPDF(Number(item.unit_price)),
            formatCurrencyForPDF(Number(item.unit_price) * item.quantity),
          ]);
        });
      });

      autoTable(doc, {
        startY: 84,
        head: [['Date', 'Product', 'Quantity', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [22, 119, 255] },
        styles: { fontSize: 9 },
      });
    }

    // Save
    const fileName = `customer-${customerDetails.first_name}-${customerDetails.last_name}-${dayjs().format('YYYY-MM-DD')}.pdf`;
    doc.save(fileName);
    message.success('PDF exported successfully!');
  };

  const columns = [
    {
      title: 'CUSTOMER NAME',
      dataIndex: 'first_name',
      key: 'name',
      render: (_: string, record: Customer) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserAddOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{`${record.first_name} ${record.last_name}`}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'CONTACT INFO',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => <div>{phone}</div>,
    },
    {
      title: 'TOTAL ORDERS',
      dataIndex: 'total_orders',
      key: 'orders',
      align: 'center' as const,
      render: (orders: number) => <Tag color="blue">{orders} Orders</Tag>,
    },
    {
      title: 'TOTAL SPENT',
      dataIndex: 'total_spent',
      key: 'spent',
      render: (spent: number) => <strong>{formatCurrency(parseFloat(String(spent)))}</strong>,
    },
    {
      title: 'LAST VISIT',
      dataIndex: 'last_visit',
      key: 'visit',
      render: (visit: string) => (
        <div>{visit ? dayjs(visit).fromNow() : 'Never'}</div>
      ),
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      render: (_: any, record: Customer) => (
        <Space>
          <Button
            type="primary"
            ghost
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewHistory(record.id)}
          />
          <Button
            danger
            ghost
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            loading={deleteMutation.isPending}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>Customer Management</h1>
        <p style={{ color: '#666' }}>Manage your customer relationships, tracking history, and lifetime value across all store locations.</p>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="ACTIVE THIS MONTH"
              value={customersData?.customers?.length || 0}
              suffix="customers"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="AVG. LIFETIME VALUE"
              value={
                customersData?.customers?.length > 0
                  ? formatCurrency(
                    customersData.customers.reduce(
                      (sum: number, c: Customer) => sum + parseFloat(String(c.total_spent)),
                      0
                    ) / customersData.customers.length
                  )
                  : formatCurrency(0)
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="LOYALTY CONVERSION"
              value={
                customersData?.customers?.length > 0
                  ? (
                    (customersData.customers.filter((c: Customer) => c.total_orders > 1).length /
                      customersData.customers.length) *
                    100
                  ).toFixed(1)
                  : '0'
              }
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Add Button */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} justify="space-between" align="middle">
          <Col flex={1}>
            <Input
              placeholder="Search by name, email or phone..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ borderRadius: 8, height: 40 }}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => navigate('/customers/new')}
              style={{ height: 40, borderRadius: 8 }}
            >
              Add Customer
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Customers Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={customersData?.customers || []}
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: customersData?.total || 0,
            onChange: (p, size) => {
              setPage(p);
              setPageSize(size);
            },
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
          rowKey="id"
          style={{ borderRadius: 8 }}
        />
      </Card>

      {/* Purchase History Modal */}
      <Modal
        title={customerDetails ? `${customerDetails.first_name} ${customerDetails.last_name} - Purchase History` : 'Purchase History'}
        open={historyModalVisible}
        onCancel={handleCloseModal}
        width={900}
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            Close
          </Button>,
          <Button
            key="export"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportCustomerPDF}
            disabled={!customerDetails || !customerDetails.sales || customerDetails.sales.length === 0}
          >
            Export PDF
          </Button>,
        ]}
      >
        {isLoadingDetails ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Loading customer details...</div>
          </div>
        ) : customerDetails ? (
          <>
            {/* Customer Info */}
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Email">{customerDetails.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{customerDetails.phone}</Descriptions.Item>
              <Descriptions.Item label="Total Orders">
                <Tag color="blue">{customerDetails.total_orders || 0} Orders</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Spent">
                <strong>{formatCurrency(customerDetails.total_spent || 0)}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Last Visit">
                {customerDetails.last_visit ? dayjs(customerDetails.last_visit).fromNow() : 'Never'}
              </Descriptions.Item>
              <Descriptions.Item label="Customer Since">
                {dayjs(customerDetails.created_at).format('MMM DD, YYYY')}
              </Descriptions.Item>
            </Descriptions>

            {/* Purchase History */}
            <h3 style={{ marginBottom: 16 }}>Purchase History</h3>
            {customerDetails.sales && customerDetails.sales.length > 0 ? (
              <Table
                dataSource={customerDetails.sales.flatMap((sale: any) =>
                  sale.sale_items?.map((item: any) => ({
                    key: `${sale.id}-${item.id}`,
                    date: sale.created_at,
                    product: item.product?.name || 'Unknown',
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total: Number(item.unit_price) * item.quantity,
                  })) || []
                )}
                columns={[
                  {
                    title: 'Date',
                    dataIndex: 'date',
                    key: 'date',
                    render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm'),
                  },
                  {
                    title: 'Product',
                    dataIndex: 'product',
                    key: 'product',
                  },
                  {
                    title: 'Quantity',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    align: 'center' as const,
                  },
                  {
                    title: 'Unit Price',
                    dataIndex: 'unit_price',
                    key: 'unit_price',
                    render: (price: number) => formatCurrency(price),
                  },
                  {
                    title: 'Total',
                    dataIndex: 'total',
                    key: 'total',
                    render: (total: number) => <strong>{formatCurrency(total)}</strong>,
                  },
                ]}
                pagination={{ pageSize: 10 }}
                size="small"
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                No purchase history available
              </div>
            )}
          </>
        ) : null}
      </Modal>
    </div>
  );
};

export default CustomersPage;
