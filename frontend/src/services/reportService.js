import api from './api';

const downloadFile = (response, filename) => {
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const reportService = {
    getSalesReport: async (params) => {
        if (params?.export) {
            const response = await api.get('/reports/sales/', { params, responseType: 'blob' });
            const ext = params.export === 'excel' ? 'xlsx' : 'pdf';
            downloadFile(response, `sales_report.${ext}`);
            return true;
        }
        const response = await api.get('/reports/sales/', { params });
        return response.data;
    },

    getProductReport: async (params) => {
        if (params?.export) {
            const response = await api.get('/reports/products/', { params, responseType: 'blob' });
            const ext = params.export === 'excel' ? 'xlsx' : 'pdf';
            downloadFile(response, `product_report.${ext}`);
            return true;
        }
        const response = await api.get('/reports/products/', { params });
        return response.data;
    },

    getInventoryReport: async (params) => {
        if (params?.export) {
            const response = await api.get('/reports/inventory/', { params, responseType: 'blob' });
            const ext = params.export === 'excel' ? 'xlsx' : 'pdf';
            downloadFile(response, `inventory_report.${ext}`);
            return true;
        }
        const response = await api.get('/reports/inventory/', { params });
        return response.data;
    },

    getCustomerReport: async (params) => {
        if (params?.export) {
            const response = await api.get('/reports/customers/', { params, responseType: 'blob' });
            const ext = params.export === 'excel' ? 'xlsx' : 'pdf';
            downloadFile(response, `customer_report.${ext}`);
            return true;
        }
        const response = await api.get('/reports/customers/', { params });
        return response.data;
    },

    getFinancialReport: async (params) => {
        if (params?.export) {
            const response = await api.get('/reports/financial/', { params, responseType: 'blob' });
            const ext = params.export === 'excel' ? 'xlsx' : 'pdf';
            downloadFile(response, `financial_report.${ext}`);
            return true;
        }
        const response = await api.get('/reports/financial/', { params });
        return response.data;
    }
};
