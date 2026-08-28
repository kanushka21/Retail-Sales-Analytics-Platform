import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import analyticsService from '../services/analyticsService';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const Dashboard = ({ setAuth }) => {
    const [userData, setUserData] = useState(null);
    const [summary, setSummary] = useState(null);
    const [salesTrend, setSalesTrend] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [categorySales, setCategorySales] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);

    const [period, setPeriod] = useState('all'); // all, today, this_month, this_year
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProtectedData = async () => {
            try {
                const response = await api.get('accounts/test/');
                setUserData(response.data.user);
            } catch (err) {
                console.error("Failed to fetch user data:", err);
                if (err.response && err.response.status === 401) {
                    handleLogout();
                }
            }
        };

        fetchProtectedData();
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const [sumData, trendData, catData, topProdData, payData] = await Promise.all([
                analyticsService.getDashboardSummary(period),
                analyticsService.getSalesTrend(period === 'all' || period === 'this_year' ? 'monthly' : 'daily'),
                analyticsService.getCategorySales(),
                analyticsService.getTopProducts(),
                analyticsService.getPaymentAnalytics()
            ]);
            setSummary(sumData);
            setSalesTrend(trendData);
            setCategorySales(catData);
            setTopProducts(topProdData);
            setPaymentMethods(payData);
        } catch (err) {
            console.error(err);
            setError("Failed to load dashboard analytics.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setAuth(false);
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <nav className="bg-white shadow-sm border-b border-slate-200 px-4 md:px-8 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                        RA
                    </div>
                    <span className="text-xl font-bold text-slate-800 tracking-tight hidden sm:inline">Retail Analytics</span>
                </div>
                <div className="hidden md:flex space-x-6 lg:space-x-8 mr-auto ml-10 overflow-x-auto">
                    <Link to="/dashboard" className="text-indigo-600 font-medium border-b-2 border-indigo-600 pb-1 whitespace-nowrap">Dashboard</Link>
                    <Link to="/sales/new" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors whitespace-nowrap">POS</Link>
                    <Link to="/sales" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors whitespace-nowrap">Sales History</Link>
                    <Link to="/products" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors whitespace-nowrap">Products</Link>
                    <Link to="/inventory" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors whitespace-nowrap">Inventory</Link>
                    <Link to="/customers" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors whitespace-nowrap">Customers</Link>
                    <Link to="/reports" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors whitespace-nowrap">Reports</Link>
                    <Link to="/forecast" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors whitespace-nowrap">Forecast</Link>
                </div>
                <div className="flex items-center space-x-4 lg:space-x-6">
                    {userData && (
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-slate-800">{userData.first_name} {userData.last_name}</p>
                            <p className="text-xs text-indigo-600 font-medium bg-indigo-50 inline-block px-2 py-0.5 rounded-full mt-1">{userData.role}</p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
                        <p className="text-slate-500 mt-1">Store performance and insights.</p>
                    </div>
                    <div className="w-full sm:w-auto">
                        <select
                            className="w-full sm:w-auto border border-slate-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="last_7_days">Last 7 Days</option>
                            <option value="this_month">This Month</option>
                            <option value="this_year">This Year</option>
                        </select>
                    </div>
                </div>

                {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8">{error}</div>}

                {loading || !summary ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <h3 className="text-sm font-medium text-slate-500 mb-2">Total Revenue</h3>
                                <p className="text-2xl md:text-3xl font-bold text-indigo-700">${parseFloat(summary.total_revenue).toFixed(2)}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <h3 className="text-sm font-medium text-slate-500 mb-2">Total Profit</h3>
                                <p className="text-2xl md:text-3xl font-bold text-emerald-600">${parseFloat(summary.total_profit).toFixed(2)}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <h3 className="text-sm font-medium text-slate-500 mb-2">Total Orders</h3>
                                <p className="text-2xl md:text-3xl font-bold text-slate-900">{summary.total_orders}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <h3 className="text-sm font-medium text-slate-500 mb-2">Units Sold</h3>
                                <p className="text-2xl md:text-3xl font-bold text-slate-900">{summary.total_units_sold}</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <h3 className="text-sm font-medium text-slate-500 mb-2">Total Customers</h3>
                                <p className="text-2xl md:text-3xl font-bold text-slate-900">{summary.total_customers}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <h3 className="text-sm font-medium text-slate-500 mb-2">Total Products</h3>
                                <p className="text-2xl md:text-3xl font-bold text-slate-900">{summary.total_products}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <h3 className="text-sm font-medium text-slate-500 mb-2">Low Stock</h3>
                                <p className="text-2xl md:text-3xl font-bold text-yellow-600">{summary.low_stock_count}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <h3 className="text-sm font-medium text-slate-500 mb-2">Out of Stock</h3>
                                <p className="text-2xl md:text-3xl font-bold text-red-600">{summary.out_of_stock_count}</p>
                            </div>
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                            {/* Revenue Trend Line Chart */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h2 className="text-lg font-bold text-slate-800 mb-4">Revenue Trend</h2>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={salesTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} width={80} tickFormatter={(val) => `$${val}`} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value) => [`$${value}`, 'Revenue']}
                                            />
                                            <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Top Products Bar Chart */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h2 className="text-lg font-bold text-slate-800 mb-4">Top 10 Products by Units</h2>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                            <YAxis dataKey="product_name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={120} />
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="units" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Category Sales Donut Chart */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h2 className="text-lg font-bold text-slate-800 mb-4">Revenue by Category</h2>
                                <div className="h-72 flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categorySales}
                                                dataKey="revenue"
                                                nameKey="category"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={2}
                                            >
                                                {categorySales.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, 'Revenue']}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Payment Methods Chart */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h2 className="text-lg font-bold text-slate-800 mb-4">Payment Methods</h2>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={paymentMethods} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="payment_method" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="transactions" fill="#8b5cf6" name="Transactions" radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
