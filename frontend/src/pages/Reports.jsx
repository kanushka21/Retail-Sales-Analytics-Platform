import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { Download, FileText, Calendar, Filter, X } from 'lucide-react';

const formatCurrency = (val) => {
    const num = Number(val);
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

const formatNumber = (val) => {
    const num = Number(val);
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('en-US').format(num);
};

const Reports = ({ setAuth }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('sales');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState(null);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [stockStatus, setStockStatus] = useState('');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        setData([]);
        setSummary(null);
        try {
            const params = { start_date: startDate, end_date: endDate };
            let result = null;
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
            }
            
            if (result) {
                setData(result.data || []);
                setSummary(result.summary || null);
            }
        } catch (err) {
            console.error('Error fetching report', err);
            setError('Unable to load report data. Please try again.');
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
        // We update state, then call fetchData. State might not be flush immediately,
        // so we manually override the params for this one call, or use setTimeout.
        setTimeout(() => {
            fetchData();
        }, 0);
    };

    const renderSummaryCards = () => {
        if (!summary) return null;
        
        let cards = [];
        if (activeTab === 'sales') {
            cards = [
                { label: 'Total Sales', value: formatCurrency(summary['Total Sales']) },
                { label: 'Total Orders', value: formatNumber(summary['Total Orders']) },
                { label: 'Total Discount', value: formatCurrency(summary['Total Discount']) },
                { label: 'Average Order Value', value: formatCurrency(summary['Average Order Value']) },
            ];
        } else if (activeTab === 'products') {
            cards = [
                { label: 'Total Products', value: formatNumber(summary['Total Products']) },
                { label: 'Units Sold', value: formatNumber(summary['Units Sold']) },
                { label: 'Total Revenue', value: formatCurrency(summary['Total Revenue']) },
                { label: 'Total Profit', value: formatCurrency(summary['Total Profit']) },
            ];
        } else if (activeTab === 'inventory') {
            cards = [
                { label: 'Total Products', value: formatNumber(summary['Total Products']) },
                { label: 'Total Stock Units', value: formatNumber(summary['Total Stock']) },
                { label: 'Low Stock Items', value: formatNumber(summary['Low Stock']), warning: summary['Low Stock'] > 0 },
                { label: 'Out of Stock Items', value: formatNumber(summary['Out of Stock']), danger: summary['Out of Stock'] > 0 },
                { label: 'Total Inventory Value', value: formatCurrency(summary['Total Inventory Value']) },
            ];
        } else if (activeTab === 'customers') {
            cards = [
                { label: 'Total Customers', value: formatNumber(summary['Total Customers']) },
                { label: 'Active Customers', value: formatNumber(summary['Active Customers']) },
                { label: 'Total Revenue', value: formatCurrency(summary['Total Revenue']) },
                { label: 'Average Spend', value: formatCurrency(summary['Average Spend']) },
            ];
        } else if (activeTab === 'financial') {
            cards = [
                { label: 'Total Revenue', value: formatCurrency(summary['Total Revenue']) },
                { label: 'Total Cost', value: formatCurrency(summary['Total Cost']) },
                { label: 'Gross Profit', value: formatCurrency(summary['Gross Profit']), success: summary['Gross Profit'] > 0, danger: summary['Gross Profit'] < 0 },
                { label: 'Total Discounts', value: formatCurrency(summary['Total Discounts']) },
                { label: 'Total Orders', value: formatNumber(summary['Total Orders']) },
                { label: 'Average Order Value', value: formatCurrency(summary['Average Order Value']) },
            ];
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {cards.map((c, i) => (
                    <div key={i} className="bg-slate-800 border border-slate-700/50 rounded-xl p-5 shadow-sm">
                        <p className="text-slate-400 text-sm font-medium mb-1">{c.label}</p>
                        <h3 className={`text-2xl font-bold ${c.danger ? 'text-red-400' : c.warning ? 'text-yellow-400' : c.success ? 'text-green-400' : 'text-slate-100'}`}>
                            {c.value}
                        </h3>
                    </div>
                ))}
            </div>
        );
    };

    const renderTable = () => {
        if (loading) return <div className="p-8 text-center text-slate-400">Loading report data...</div>;
        if (error) return <div className="p-8 text-center text-red-400">{error}</div>;
        if (!data || data.length === 0) return <div className="p-8 text-center text-slate-400">No data available for the selected date range.</div>;

        let headers = [];
        let rows = [];

        if (activeTab === 'sales') {
            headers = ['Sale ID', 'Date', 'Customer', 'Items', 'Subtotal', 'Discount', 'Total', 'Payment Method', 'Created By'];
            rows = data.map(d => [
                d.sale_id, d.date, d.customer, d.items_count, 
                formatCurrency(d.subtotal), formatCurrency(d.discount), formatCurrency(d.total), 
                d.payment_method, d.created_by
            ]);
        } else if (activeTab === 'products') {
            headers = ['Product Name', 'SKU', 'Category', 'Unit Price', 'Cost Price', 'Current Stock', 'Units Sold', 'Revenue', 'Profit', 'Stock Status'];
            rows = data.map(d => [
                d.product_name, d.sku, d.category, 
                formatCurrency(d.unit_price), formatCurrency(d.cost_price), 
                formatNumber(d.current_stock), formatNumber(d.qty_sold), 
                formatCurrency(d.revenue), formatCurrency(d.profit),
                <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${d.stock_status === 'in_stock' ? 'bg-green-500/20 text-green-400' : d.stock_status === 'low_stock' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                    {d.stock_status.replace('_', ' ').toUpperCase()}
                </span>
            ]);
        } else if (activeTab === 'inventory') {
            headers = ['Product', 'SKU', 'Category', 'Current Stock', 'Min Stock', 'Stock Value', 'Status', 'Last Updated'];
            rows = data.map(d => [
                d.product, d.sku, d.category, 
                formatNumber(d.current_stock), formatNumber(d.min_stock), 
                formatCurrency(d.stock_value),
                <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${d.status === 'in_stock' ? 'bg-green-500/20 text-green-400' : d.status === 'low_stock' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                    {d.status.replace('_', ' ').toUpperCase()}
                </span>,
                d.last_updated
            ]);
        } else if (activeTab === 'customers') {
            headers = ['Customer Name', 'Email', 'Phone', 'Purchases', 'Total Spend', 'Avg Order Value', 'Last Purchase'];
            rows = data.map(d => [
                d.customer_name, d.email, d.phone, 
                formatNumber(d.num_purchases), formatCurrency(d.total_spend), 
                formatCurrency(d.avg_order_value), d.last_purchase
            ]);
        } else if (activeTab === 'financial') {
            headers = ['Metric', 'Value'];
            rows = data.map(d => [
                d.metric, 
                d.metric === 'Number of Orders' ? formatNumber(d.value) : formatCurrency(d.value)
            ]);
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-300">
                    <thead className="bg-slate-700/50 text-slate-200">
                        <tr>
                            {headers.map((h, i) => (
                                <th key={i} className="p-4 font-semibold whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors">
                                {row.map((cell, j) => (
                                    <td key={j} className="p-4 whitespace-nowrap">{cell}</td>
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
        <div className="min-h-screen bg-slate-900 text-white font-sans">
            <Navbar setAuth={setAuth} />
            <div className="p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-100">Reports & Analytics</h1>
                            <p className="text-slate-400 mt-1">Export and analyze detailed business performance.</p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => handleExport('excel')}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                            >
                                <Download size={18} />
                                Export Excel
                            </button>
                            <button 
                                onClick={() => handleExport('pdf')}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm"
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
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
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
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
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
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="in_stock">In Stock</option>
                                    <option value="low_stock">Low Stock</option>
                                    <option value="out_of_stock">Out of Stock</option>
                                </select>
                            </div>
                        )}

                        <div className="flex gap-2 ml-auto">
                            <button type="button" onClick={handleReset} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm">
                                <X size={16} /> Reset
                            </button>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm">
                                <Filter size={16} /> Apply Filters
                            </button>
                        </div>
                    </form>

                    {/* Summary Cards */}
                    {renderSummaryCards()}

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
