import React from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';

const { Title, Text } = Typography;

const NewCustomerPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const fromSales = location.state?.from === 'sales';

  const createMutation = useMutation({
    mutationFn: (newCustomer: any) => api.post('/customers', newCustomer),
    onSuccess: () => {
      message.success('Customer created successfully');
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      if (fromSales) {
        navigate('/sales/new', { state: { from: 'customers' } });
      } else {
        navigate('/customers');
      }
    },
    onError: (error: any) => message.error(error.response?.data?.message || 'Error creating customer'),
  });

  const onFinish = (values: any) => {
    createMutation.mutate(values);
  };

  const handleCancel = () => {
    if (fromSales) {
      navigate('/sales/new');
    } else {
      navigate('/customers');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={handleCancel}
        style={{ marginBottom: 16 }}
      >
        Back {fromSales ? 'to Sale' : 'to Customers'}
      </Button>

      <Card>
        <div style={{ marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>Add New Customer Profile</Title>
          <Text type="secondary">Enter the customer information below to create a new profile in the database.</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Form.Item
              label={<Text strong>First Name</Text>}
              name="first_name"
              rules={[{ required: true, message: 'Please input first name!' }]}
            >
              <Input placeholder="e.g. John" style={{ borderRadius: 8, height: 40 }} />
            </Form.Item>

            <Form.Item
              label={<Text strong>Last Name</Text>}
              name="last_name"
              rules={[{ required: true, message: 'Please input last name!' }]}
            >
              <Input placeholder="e.g. Doe" style={{ borderRadius: 8, height: 40 }} />
            </Form.Item>
          </div>

          <Form.Item
            label={<Text strong>Email Address</Text>}
            name="email"
            rules={[
              { required: true, message: 'Please input email!' },
              { type: 'email', message: 'Please input valid email!' },
            ]}
          >
            <Input placeholder="example@mail.com" style={{ borderRadius: 8, height: 40 }} />
          </Form.Item>

          <Form.Item
            label={<Text strong>Phone Number</Text>}
            name="phone"
            rules={[{ required: true, message: 'Please input phone number!' }]}
          >
            <Input placeholder="+1 (555) 000-0000" style={{ borderRadius: 8, height: 40 }} />
          </Form.Item>

          <Form.Item
            label={<Text strong>Internal Notes</Text>}
            name="internal_notes"
          >
            <Input.TextArea
              placeholder="Add any relevant information about preferences, allergies, or history..."
              rows={5}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            <Button
              onClick={handleCancel}
              style={{ height: 40, borderRadius: 8, padding: '0 24px' }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={createMutation.isPending}
              style={{ height: 40, borderRadius: 8, padding: '0 24px' }}
            >
              Save Customer
            </Button>
          </div>
        </Form>

        <div style={{ marginTop: 24, padding: 16, backgroundColor: '#e6f7ff', borderRadius: 8 }}>
          <Text type="secondary">
            <strong>Data Privacy Notice:</strong> Customer profiles are synced across all terminal instances. Ensure you have the customer's consent before collecting sensitive contact details.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default NewCustomerPage;
