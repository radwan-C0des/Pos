import React, { useState } from 'react';
import { Table, DatePicker, Typography, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const SalesHistoryPage: React.FC = () => {
    const [dates, setDates] = useState<any>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['sales-history', dates],
        queryFn: async () => {
            const params: any = {};
            if (dates) {
                params.startDate = dates[0].toISOString();
                params.endDate = dates[1].toISOString();
            }
            const { data } = await api.get('/sales', { params });
            return data;
        },
        retry: 1,
        staleTime: 0, // Always fetch fresh data
    });

    const columns = [
        {
            title: 'Transaction ID',
            dataIndex: 'id',
            key: 'id',
            render: (id: string) => <code>{id?.slice(0, 8) || ''}</code>
        },
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'date',
            render: (date: string) => new Date(date).toLocaleString(),
        },
        {
            title: 'Total amount',
            dataIndex: 'total_amount',
            key: 'total_amount',
            render: (val: any) => `$${val}`,
        },
        {
            title: 'Items',
            key: 'items',
            render: (_: any, record: any) => (
                <ul>
                    {record.sale_items?.map((item: any) => (
                        <li key={item.id}>
                            {item.product?.name} x {item.quantity}
                        </li>
                    ))}
                </ul>
            ),
        },
    ];

    // Show loading spinner on initial load
    if (isLoading && !data) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>Loading sales data...</div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: 32 }}>
                <Title level={2}>Sales History</Title>
                <RangePicker onChange={(v) => setDates(v)} />
            </div>

            <Table
                columns={columns}
                dataSource={data?.sales || []}
                loading={isLoading}
                rowKey="id"
                pagination={{ total: data?.total || 0 }}
            />
        </div>
    );
};

export default SalesHistoryPage;
