import api from './api';

const saleService = {
    getSales: async () => {
        const response = await api.get('/sales/');
        return response.data;
    },
    
    getSale: async (id) => {
        const response = await api.get(`/sales/${id}/`);
        return response.data;
    },
    
    createSale: async (data) => {
        const response = await api.post('/sales/', data);
        return response.data;
    }
};

export default saleService;
