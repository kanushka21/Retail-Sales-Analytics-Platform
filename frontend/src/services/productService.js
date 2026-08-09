import api from './api';

export const getProducts = async (search = '', category = '') => {
    let url = '/products/';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    
    if (params.toString()) {
        url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
};

export const getProduct = async (id) => {
    const response = await api.get(`/products/${id}/`);
    return response.data;
};

export const createProduct = async (productData) => {
    const response = await api.post('/products/', productData);
    return response.data;
};

export const updateProduct = async (id, productData) => {
    const response = await api.patch(`/products/${id}/`, productData);
    return response.data;
};

export const deleteProduct = async (id) => {
    const response = await api.delete(`/products/${id}/`);
    return response.data;
};

export const getCategories = async () => {
    const response = await api.get('/categories/');
    return response.data;
};
