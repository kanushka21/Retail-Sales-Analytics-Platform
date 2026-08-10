import api from './api';

export const getCustomers = async (search = '') => {
    let url = '/customers/';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    
    if (params.toString()) {
        url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
};

export const getCustomer = async (id) => {
    const response = await api.get(`/customers/${id}/`);
    return response.data;
};

export const createCustomer = async (customerData) => {
    const response = await api.post('/customers/', customerData);
    return response.data;
};

export const updateCustomer = async (id, customerData) => {
    const response = await api.patch(`/customers/${id}/`, customerData);
    return response.data;
};

export const deleteCustomer = async (id) => {
    const response = await api.delete(`/customers/${id}/`);
    return response.data;
};
