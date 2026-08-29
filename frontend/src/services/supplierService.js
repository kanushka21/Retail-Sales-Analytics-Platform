import api from './api';

export const getSuppliers = async (search = '') => {
    let url = '/suppliers/';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    
    if (params.toString()) {
        url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
};

export const getSupplier = async (id) => {
    const response = await api.get(`/suppliers/${id}/`);
    return response.data;
};

export const createSupplier = async (supplierData) => {
    const response = await api.post('/suppliers/', supplierData);
    return response.data;
};

export const updateSupplier = async (id, supplierData) => {
    const response = await api.patch(`/suppliers/${id}/`, supplierData);
    return response.data;
};

export const deleteSupplier = async (id) => {
    const response = await api.delete(`/suppliers/${id}/`);
    return response.data;
};
