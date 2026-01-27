import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

interface Notification {
    id: string;
    type: 'sale' | 'low_stock' | 'system';
    message: string;
    data?: any;
    read: boolean;
    created_at: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    addNotification: (notification: Omit<Notification, 'id' | 'read' | 'created_at'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [lastSaleCount, setLastSaleCount] = useState<number>(0);

    // Fetch recent sales to detect new ones
    const { data: salesData } = useQuery({
        queryKey: ['sales-notifications'],
        queryFn: async () => {
            const { data } = await api.get('/sales', { params: { limit: 10 } });
            return data;
        },
        refetchInterval: 10000, // Poll every 10 seconds
    });

    // Detect new sales and create notifications
    useEffect(() => {
        if (salesData?.sales) {
            const currentCount = salesData.total || salesData.sales.length;
            
            // If there are more sales than before, create notification
            if (lastSaleCount > 0 && currentCount > lastSaleCount) {
                const latestSale = salesData.sales[0];
                
                addNotification({
                    type: 'sale',
                    message: `New sale completed! Total: $${latestSale?.total_amount || 0}`,
                    data: latestSale,
                });
            }
            
            setLastSaleCount(currentCount);
        }
    }, [salesData]);

    const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'created_at'>) => {
        const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(),
            read: false,
            created_at: new Date().toISOString(),
        };
        
        setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => 
            prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                markAsRead,
                markAllAsRead,
                addNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};
