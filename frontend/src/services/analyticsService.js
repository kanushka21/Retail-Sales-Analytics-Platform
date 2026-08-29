import api from './api';

const analyticsService = {
    getDashboardSummary: async (params) => {
        const response = await api.get(`/analytics/summary/`, { params });
        return response.data;
    },
    
    getSalesTrend: async (params) => {
        const response = await api.get(`/analytics/sales-trend/`, { params });
        return response.data;
    },
    
    getCategorySales: async (params) => {
        const response = await api.get('/analytics/category-sales/', { params });
        return response.data;
    },
    
    getTopProducts: async (params) => {
        const response = await api.get('/analytics/top-products/', { params });
        return response.data;
    },

    getPaymentAnalytics: async (params) => {
        const response = await api.get('/analytics/payment-methods/', { params });
        return response.data;
    },

    getForecast: async (days) => {
        const response = await api.get(`/analytics/forecast/?days=${days}`);
        return response.data;
    }
};

export default analyticsService;
