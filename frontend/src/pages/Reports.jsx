import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { Download, FileText, Calendar, Filter, X } from 'lucide-react';

const Reports = ({ setAuth }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('sales');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (setAuth) setAuth(false);
        navigate('/');
    };

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [stockStatus, setStockStatus] = useState('');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { start_date: startDate, end_date: endDate };
            let result = [];
            if (activeTab === 'sales') {
                result = await reportService.getSalesReport(params);
            } else if (activeTab === 'products') {
                result = await reportService.getProductReport(params);
            } else if (activeTab === 'inventory') {
                result = await reportService.getInventoryReport({ stock_status: stockStatus });
            } else if (activeTab === 'customers') {
                result = await reportService.getCustomerReport(params);
            } else if (activeTab === 'financial') {
                result = await reportService.getFinancialReport(params);
                result = result.summary || [];
            }
            setData(result);
        } catch (err) {
            console.error('Error fetching report', err);
            setError('Failed to load report data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleExport = async (format) => {
        try {
            const params = { start_date: startDate, end_date: endDate, export: format };
            if (activeTab === 'sales') await reportService.getSalesReport(params);
            else if (activeTab === 'products') await reportService.getProductReport(params);
            else if (activeTab === 'inventory') await reportService.getInventoryReport({ stock_status: stockStatus, export: format });
            else if (activeTab === 'customers') await reportService.getCustomerReport(params);
            else if (activeTab === 'financial') await reportService.getFinancialReport(params);
        } catch (err) {
            console.error(`Error exporting ${format}`, err);
            alert(`Failed to export ${format}`);
        }
    };

    const handleFilter = (e) => {
        e.preventDefault();
        fetchData();
    };

    const handleReset = () => {
        setStartDate('');
        setEndDate('');
        setStockStatus('');
        // need to use setTimeout or useEffect to fetch after state updates, 
        // but for simplicity we can just pass empty values directly
        setLoading(true);
        const params = { start_date: '', end_date: '' };
        let promise;
        if (activeTab === 'sales') promise = reportService.getSalesReport(params);
        else if (activeTab === 'products') promise = reportService.getProductReport(params);
        else if (activeTab === 'inventory') promise = reportService.getInventoryReport({ stock_status: '' });
        else if (activeTab === 'customers') promise = reportService.getCustomerReport(params);
        else if (activeTab === 'financial') promise = reportService.getFinancialReport(params);
        
        promise.then(res => {
            setData(activeTab === 'financial' ? (res.summary || []) : res);
            setLoading(false);
        }).catch(() => {
            setError('Failed to load report data.');
            setLoading(false);
        });
    };

    const renderTable = () => {
        if (loading) return <div className="p-8 text-center text-slate-400">Loading report data...</div>;
        if (error) return <div className="p-8 text-center text-red-400">{error}</div>;
        if (!data || data.length === 0) return <div className="p-8 text-center text-slate-400">No data found for this report.</div>;

        let headers = [];
        let rows = [];

        if (activeTab === 'sales') {
            headers = ['Sale ID', 'Date', 'Customer', 'Items', 'Subtotal', 'Discount', 'Total', 'Payment Method', 'Created By'];
            rows = data.map(d => [d.sale_id, d.date, d.customer, d.items_count, `$${d.subtotal.toFixed(2)}`, `$${d.discount.toFixed(2)}`, `$${d.total.toFixed(2)}`, d.payment_method, d.created_by]);
        } else if (activeTab === 'products') {
            headers = ['Product Name', 'SKU', 'Category', 'Quantity Sold', 'Revenue', 'Current Stock'];
            rows = data.map(d => [d.product_name, d.sku, d.category, d.qty_sold, `$${d.revenue.toFixed(2)}`, d.current_stock]);
        } else if (activeTab === 'inventory') {
            headers = ['Product', 'SKU', 'Category', 'Current Stock', 'Min Stock', 'Status', 'Last Updated'];
            rows = data.map(d => [
                d.product, 
                d.sku, 
                d.category, 
                d.current_stock, 
                d.min_stock, 
                <span className={`px-2 py-1 rounded text-xs ${d.status === 'in_stock' ? 'bg-green-500/20 text-green-400' : d.status === 'low_stock' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                    {d.status.replace('_', ' ').toUpperCase()}
                </span>,
                d.last_updated
            ]);
        } else if (activeTab === 'customers') {
            headers = ['Customer Name', 'Email', 'Phone', 'Purchases', 'Total Spend', 'Last Purchase'];
            rows = data.map(d => [d.customer_name, d.email, d.phone, d.num_purchases, `$${d.total_spend.toFixed(2)}`, d.last_purchase]);
        } else if (activeTab === 'financial') {
            headers = ['Metric', 'Value'];
            rows = data.map(d => [d.metric, typeof d.value === 'number' && d.metric !== 'Number of Orders' ? `$${d.value.toFixed(2)}` : d.value]);
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-300">
                    <thead className="bg-slate-700/50 text-slate-200">
                        <tr>
                            {headers.map((h, i) => (
                                <th key={i} className="p-4 font-semibold">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors">
                                {row.map((cell, j) => (
                                    <td key={j} className="p-4">{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const tabs = [
        { id: 'sales', label: 'Sales Reports' },
        { id: 'products', label: 'Product Reports' },
        { id: 'inventory', label: 'Inventory Reports' },
        { id: 'customers', label: 'Customer Reports' },
        { id: 'financial', label: 'Financial Summary' },
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <nav className="bg-slate-800 shadow-sm border-b border-slate-700 px-4 md:px-8 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                        RA
                    </div>
                    <span className="text-xl font-bold text-slate-100 tracking-tight hidden sm:inline">Retail Analytics</span>
                </div>
                <div className="hidden md:flex space-x-6 lg:space-x-8 mr-auto ml-10 overflow-x-auto">
                    <Link to="/dashboard" className="text-slate-400 hover:text-indigo-400 font-medium transition-colors whitespace-nowrap">Dashboard</Link>
                    <Link to="/sales/new" className="text-slate-400 hover:text-indigo-400 font-medium transition-colors whitespace-nowrap">POS</Link>
                    <Link to="/sales" className="text-slate-400 hover:text-indigo-400 font-medium transition-colors whitespace-nowrap">Sales History</Link>
                    <Link to="/products" className="text-slate-400 hover:text-indigo-400 font-medium transition-colors whitespace-nowrap">Products</Link>
                    <Link to="/inventory" className="text-slate-400 hover:text-indigo-400 font-medium transition-colors whitespace-nowrap">Inventory</Link>
                    <Link to="/customers" className="text-slate-400 hover:text-indigo-400 font-medium transition-colors whitespace-nowrap">Customers</Link>
                    <Link to="/reports" className="text-indigo-400 font-medium border-b-2 border-indigo-400 pb-1 whitespace-nowrap">Reports</Link>
                    <Link to="/forecast" className="text-slate-400 hover:text-indigo-400 font-medium transition-colors whitespace-nowrap">Forecast</Link>
                </div>
                <div className="flex items-center space-x-4 lg:space-x-6">
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-slate-700 border border-slate-600 text-slate-200 font-medium rounded-lg hover:bg-slate-600 hover:text-red-400 hover:border-red-400/50 transition-colors shadow-sm"
                    >
                        Logout
                    </button>
                </div>
            </nav>
            <div className="p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
                            <p className="text-slate-400 mt-1">Generate, view, and export business reports.</p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => handleExport('excel')}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
                            >
                                <Download size={18} />
                                Export Excel
                            </button>
                            <button 
                                onClick={() => handleExport('pdf')}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
                            >
                                <FileText size={18} />
                                Export PDF
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex overflow-x-auto border-b border-slate-700 gap-6">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-3 font-medium text-sm whitespace-nowrap transition-colors ${
                                    activeTab === tab.id 
                                        ? 'border-b-2 border-indigo-500 text-indigo-400' 
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Filters */}
                    <form onSubmit={handleFilter} className="bg-slate-800 p-4 rounded-xl flex flex-wrap items-end gap-4 shadow-lg border border-slate-700/50">
                        {activeTab !== 'inventory' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium ml-1">Start Date</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar size={16} className="text-slate-400" />
                                        </div>
                                        <input 
                                            type="date" 
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium ml-1">End Date</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar size={16} className="text-slate-400" />
                                        </div>
                                        <input 
                                            type="date" 
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'inventory' && (
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 font-medium ml-1">Stock Status</label>
                                <select
                                    value={stockStatus}
                                    onChange={(e) => setStockStatus(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="in_stock">In Stock</option>
                                    <option value="low_stock">Low Stock</option>
                                    <option value="out_of_stock">Out of Stock</option>
                                </select>
                            </div>
                        )}

                        <div className="flex gap-2 ml-auto">
                            <button type="button" onClick={handleReset} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors flex items-center gap-2">
                                <X size={16} /> Reset
                            </button>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors flex items-center gap-2">
                                <Filter size={16} /> Apply Filters
                            </button>
                        </div>
                    </form>

                    {/* Table Data */}
                    <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700/50 overflow-hidden">
                        {renderTable()}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Reports;
