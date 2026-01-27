import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../api/axios';

interface Preferences {
    currency: string;
    dateFormat: string;
    theme: string;
    language: string;
}

interface LocalizationContextType {
    preferences: Preferences;
    setPreferences: (prefs: Preferences) => void;
    formatCurrency: (amount: number | string) => string;
    t: (key: string) => string;
    savePreferences: () => Promise<void>;
}

const defaultPreferences: Preferences = {
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    theme: 'light',
    language: 'en',
};

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [preferences, setPreferencesState] = useState<Preferences>(() => {
        const saved = localStorage.getItem('userPreferences');
        return saved ? JSON.parse(saved) : defaultPreferences;
    });

    useEffect(() => {
        localStorage.setItem('userPreferences', JSON.stringify(preferences));
    }, [preferences]);

    const setPreferences = (prefs: Preferences) => {
        setPreferencesState(prefs);
    };

    const formatCurrency = (amount: number | string): string => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        
        const currencySymbols: Record<string, string> = {
            USD: '$',
            EUR: '€',
            GBP: '£',
            INR: '₹',
            BDT: '৳',
        };

        const symbol = currencySymbols[preferences.currency] || '$';
        
        return `${symbol}${numAmount.toFixed(2)}`;
    };

    const t = (key: string): string => {
        return translations[preferences.language]?.[key] || key;
    };

    const savePreferences = async () => {
        try {
            await api.put('/auth/preferences', preferences);
        } catch (error) {
            // Preferences saved locally, backend sync failed
        }
    };

    return (
        <LocalizationContext.Provider value={{ preferences, setPreferences, formatCurrency, t, savePreferences }}>
            {children}
        </LocalizationContext.Provider>
    );
};

export const useLocalization = () => {
    const context = useContext(LocalizationContext);
    if (!context) {
        throw new Error('useLocalization must be used within LocalizationProvider');
    }
    return context;
};

// Translation dictionary
const translations: Record<string, Record<string, string>> = {
    en: {
        // Dashboard
        dashboard: 'Dashboard',
        totalRevenue: 'Total Revenue',
        totalSales: 'Total Sales',
        totalProducts: 'Total Products',
        lowStockItems: 'Low Stock Items',
        recentSales: 'Recent Sales',
        productSalesSummary: 'Product Sales Summary',
        
        // Products
        products: 'Products',
        addProduct: 'Add Product',
        productName: 'Product Name',
        sku: 'SKU',
        category: 'Category',
        price: 'Price',
        stock: 'Stock',
        actions: 'Actions',
        
        // Sales
        sales: 'Sales',
        newSale: 'New Sale',
        customer: 'Customer',
        total: 'Total',
        checkout: 'Checkout',
        
        // Common
        save: 'Save',
        cancel: 'Cancel',
        edit: 'Edit',
        delete: 'Delete',
        search: 'Search',
        filter: 'Filter',
        export: 'Export',
        settings: 'Settings',
        logout: 'Logout',
    },
    bn: {
        // Dashboard
        dashboard: 'ড্যাশবোর্ড',
        totalRevenue: 'মোট আয়',
        totalSales: 'মোট বিক্রয়',
        totalProducts: 'মোট পণ্য',
        lowStockItems: 'কম স্টক পণ্য',
        recentSales: 'সাম্প্রতিক বিক্রয়',
        productSalesSummary: 'পণ্য বিক্রয় সারসংক্ষেপ',
        
        // Products
        products: 'পণ্য',
        addProduct: 'পণ্য যোগ করুন',
        productName: 'পণ্যের নাম',
        sku: 'এসকেইউ',
        category: 'বিভাগ',
        price: 'মূল্য',
        stock: 'স্টক',
        actions: 'কার্যক্রম',
        
        // Sales
        sales: 'বিক্রয়',
        newSale: 'নতুন বিক্রয়',
        customer: 'ক্রেতা',
        total: 'মোট',
        checkout: 'চেকআউট',
        
        // Common
        save: 'সংরক্ষণ করুন',
        cancel: 'বাতিল করুন',
        edit: 'সম্পাদনা',
        delete: 'মুছুন',
        search: 'অনুসন্ধান',
        filter: 'ফিল্টার',
        export: 'রপ্তানি',
        settings: 'সেটিংস',
        logout: 'লগআউট',
    },
};
