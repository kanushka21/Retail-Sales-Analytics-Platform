import api from './api';

export const getInventory = async (params = {}) => {
  const response = await api.get('/inventory/', { params });
  return response.data;
};

export const getInventoryItem = async (id) => {
  const response = await api.get(`/inventory/${id}/`);
  return response.data;
};

export const addStock = async (id, data) => {
  const response = await api.post(`/inventory/${id}/add-stock/`, data);
  return response.data;
};

export const removeStock = async (id, data) => {
  const response = await api.post(`/inventory/${id}/remove-stock/`, data);
  return response.data;
};
