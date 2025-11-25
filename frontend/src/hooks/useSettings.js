import { useState, useEffect } from 'react';
import axios from '../utils/api';

const CURRENCY_SYMBOLS = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'BDT': '৳',
    'INR': '₹'
};

export const useSettings = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get('/api/settings');
                setSettings(res.data);
            } catch (err) {
                console.log('Failed to load settings', err);
                setError(err);
                // Set default settings
                setSettings({
                    brandName: 'MERN Shop',
                    primaryColor: '#007bff',
                    secondaryColor: '#6c757d',
                    currency: 'USD',
                    paymentMethods: [
                        { name: 'bkash', enabled: true },
                        { name: 'nagad', enabled: false },
                        { name: 'ssl_commerce', enabled: false }
                    ],
                    address: '',
                    whatsapp: '',
                    brandLogo: ''
                });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const getCurrencySymbol = () => {
        return CURRENCY_SYMBOLS[settings?.currency] || '$';
    };

    const formatPrice = (price) => {
        return `${getCurrencySymbol()}${parseFloat(price).toFixed(2)}`;
    };

    return {
        settings,
        loading,
        error,
        brandName: settings?.brandName || 'MERN Shop',
        primaryColor: settings?.primaryColor || '#007bff',
        secondaryColor: settings?.secondaryColor || '#6c757d',
        currency: settings?.currency || 'USD',
        currencySymbol: getCurrencySymbol(),
        formatPrice,
        socialLinks: settings?.socialLinks || [],
        facebookPixelId: settings?.facebookPixelId || '',
        productListPagination: settings?.productListPagination || 'numbered',
        address: settings?.address || '',
        whatsapp: settings?.whatsapp || '',
        brandLogo: settings?.brandLogo || '',
        paymentMethods: settings?.paymentMethods || []
    };
};
