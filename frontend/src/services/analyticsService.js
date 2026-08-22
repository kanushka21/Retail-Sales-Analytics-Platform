import api from './api';

const analyticsService = {
    getDashboardSummary: async (period = 'all') => {
        const response = await api.get(`/store/analytics/summary/?period=${period}`);
        return response.data;
    },
    
    getSalesTrend: async (period = 'monthly') => {
        const response = await api.get(`/store/analytics/sales-trend/?period=${period}`);
        return response.data;
    },
    
    getCategorySales: async () => {
        const response = await api.get('/store/analytics/category-sales/');
        return response.data;
    },
    
    getTopProducts: async () => {
        const response = await api.get('/store/analytics/top-products/');
        return response.data;
    },

    getPaymentAnalytics: async () => {
        const response = await api.get('/store/analytics/payment-methods/');
        return response.data;
    }
};

export default analyticsService;
