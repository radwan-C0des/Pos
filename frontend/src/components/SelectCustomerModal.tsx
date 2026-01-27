import React, { useState } from 'react';
import { Modal, Input, List, Avatar, Button, Empty, Spin, Tag, Space, Typography, Divider } from 'antd';
import { SearchOutlined, UserAddOutlined, CheckCircleOutlined, ShoppingCartOutlined, DollarOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const { Text } = Typography;

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  total_orders: number;
  total_spent: string;
  last_visit: string;
}

interface SelectCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
  selectedCustomerId?: string;
}

const SelectCustomerModal: React.FC<SelectCustomerModalProps> = ({
  visible,
  onClose,
  onSelect,
  selectedCustomerId,
}) => {
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const { data } = await api.get('/customers', { params: { limit: 100 } });
      return data.customers || [];
    },
    enabled: visible,
  });

  const filteredCustomers = (customersData || []).filter((customer: Customer) =>
    `${customer.first_name} ${customer.last_name} ${customer.email}`.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAddNewCustomer = () => {
    onClose();
    navigate('/customers/new', { state: { from: 'sales' } });
  };

  const getCustomerBadge = (customer: Customer) => {
    const orders = customer.total_orders || 0;
    if (orders === 0) return <Tag color="default">New</Tag>;
    if (orders >= 10) return <Tag color="gold">VIP</Tag>;
    if (orders >= 5) return <Tag color="blue">Member</Tag>;
    return <Tag color="default">Regular</Tag>;
  };

  return (
    <Modal
      title="Select Customer"
      open={visible}
      onCancel={onClose}
      width={700}
      bodyStyle={{ padding: 0, maxHeight: '600px', overflowY: 'auto' }}
      footer={null}
    >
      {/* Search Bar */}
      <div style={{ padding: 20, borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          placeholder="Search by name, email, or phone..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ borderRadius: 8, height: 40 }}
        />
      </div>

      {/* Customers List */}
      <div style={{ padding: 20 }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <Empty
            description="No customers found"
            style={{ paddingTop: 40, paddingBottom: 40 }}
          />
        ) : (
          <List
            dataSource={filteredCustomers}
            renderItem={(customer: Customer) => (
              <div
                key={customer.id}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  border: selectedCustomerId === customer.id ? '2px solid #1677ff' : '1px solid #f0f0f0',
                  background: selectedCustomerId === customer.id ? '#f6f8ff' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  if (selectedCustomerId !== customer.id) {
                    (e.currentTarget as HTMLElement).style.background = '#fafafa';
                    (e.currentTarget as HTMLElement).style.borderColor = '#d9d9d9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCustomerId !== customer.id) {
                    (e.currentTarget as HTMLElement).style.background = '#fff';
                    (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f0';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                    <Avatar
                      size={48}
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.id}`}
                      style={{ minWidth: 48, minHeight: 48 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 14 }}>
                          {customer.first_name} {customer.last_name}
                        </Text>
                        {getCustomerBadge(customer)}
                      </div>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                        {customer.email}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {customer.phone}
                      </Text>
                      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          <ShoppingCartOutlined style={{ marginRight: 4 }} />
                          Orders: {customer.total_orders || 0}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          <DollarOutlined style={{ marginRight: 4 }} />
                          Spent: ${parseFloat(customer.total_spent || '0').toFixed(2)}
                        </Text>
                      </div>
                    </div>
                  </div>
                  <Button
                    type={selectedCustomerId === customer.id ? 'primary' : 'default'}
                    icon={selectedCustomerId === customer.id ? <CheckCircleOutlined /> : undefined}
                    onClick={() => onSelect(customer)}
                    style={{ borderRadius: 8, height: 40 }}
                  >
                    {selectedCustomerId === customer.id ? 'Selected' : 'Select'}
                  </Button>
                </div>
              </div>
            )}
          />
        )}
      </div>

      {/* Footer */}
      <Divider style={{ margin: 0 }} />
      <div style={{ padding: 20, background: '#fafafa', borderRadius: '0 0 8px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text type="secondary">Need a new customer?</Text>
        <Space>
          <Button onClick={onClose} style={{ borderRadius: 8 }}>
            Cancel
          </Button>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleAddNewCustomer}
            style={{ borderRadius: 8 }}
          >
            Add New Customer
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default SelectCustomerModal;
