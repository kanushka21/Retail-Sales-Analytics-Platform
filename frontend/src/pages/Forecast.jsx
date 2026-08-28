import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import analyticsService from '../services/analyticsService';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Forecast = ({ setAuth }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [forecastDays, setForecastDays] = useState(7);
    const [chartData, setChartData] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [stats, setStats] = useState({
        historicalRevenue: 0,
        predictedRevenue: 0
    });

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (setAuth) setAuth(false);
        navigate('/');
    };

    useEffect(() => {
        fetchForecast();
    }, [forecastDays]);

    const fetchForecast = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await analyticsService.getForecast(forecastDays);
            
            // Format data for Recharts (combining historical and forecast)
            const combinedData = [];
            let histRev = 0;
            let predRev = 0;

            if (data.historical_data) {
                data.historical_data.forEach(item => {
                    combinedData.push({
                        date: item.date,
                        Historical: item.revenue,
                        Predicted: null // Null so it doesn't plot on this segment
                    });
                    // Only sum recent 30 days for display
                    histRev += item.revenue;
                });
            }

            if (data.forecast) {
                data.forecast.forEach(item => {
                    combinedData.push({
                        date: item.date,
                        Historical: null, // Null so it doesn't plot here
                        Predicted: item.predicted_revenue
                    });
                    predRev += item.predicted_revenue;
                });
            }

            // Optional: bridge the gap between historical and predicted
            // By finding the last historical point and putting it in both, but recharts handles it fine.
            
            setChartData(combinedData);
            setMetrics(data.model_metrics);
            
            // Re-calculate historical revenue for last 30 days if there are many days
            const recentHist = data.historical_data ? data.historical_data.slice(-30) : [];
            const recentHistRev = recentHist.reduce((sum, item) => sum + item.revenue, 0);

            setStats({
                historicalRevenue: recentHistRev,
                predictedRevenue: predRev
            });
            
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError("Failed to load forecast data.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans">
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
                    <Link to="/reports" className="text-slate-400 hover:text-indigo-400 font-medium transition-colors whitespace-nowrap">Reports</Link>
                    <Link to="/forecast" className="text-indigo-400 font-medium border-b-2 border-indigo-400 pb-1 whitespace-nowrap">Forecast</Link>
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

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100">Sales Forecast</h1>
                        <p className="text-slate-400 mt-1">Machine Learning predictions based on historical trends.</p>
                    </div>
                    <div className="w-full sm:w-auto bg-slate-800 p-1 rounded-lg border border-slate-700 inline-flex">
                        <button
                            onClick={() => setForecastDays(7)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${forecastDays === 7 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Next 7 Days
                        </button>
                        <button
                            onClick={() => setForecastDays(30)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${forecastDays === 30 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Next 30 Days
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-xl mb-8 flex items-center">
                        <svg className="w-6 h-6 mr-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
                        <p className="text-slate-400">Generating ML predictions...</p>
                    </div>
                ) : !error && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 hover:border-slate-600 transition-colors">
                                <h3 className="text-sm font-medium text-slate-400 mb-2">Historical Revenue (Last 30 Days)</h3>
                                <p className="text-3xl font-bold text-slate-100">${stats.historicalRevenue.toFixed(2)}</p>
                            </div>
                            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 hover:border-indigo-600/50 transition-colors">
                                <h3 className="text-sm font-medium text-slate-400 mb-2">Forecasted Revenue (Next {forecastDays} Days)</h3>
                                <p className="text-3xl font-bold text-indigo-400">${stats.predictedRevenue.toFixed(2)}</p>
                            </div>
                            {metrics && (
                                <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 transition-colors flex flex-col justify-center">
                                    <h3 className="text-sm font-medium text-slate-400 mb-3 border-b border-slate-700 pb-2">Model Information</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="text-slate-500">Algorithm:</div>
                                        <div className="text-slate-200 font-medium text-right">{metrics.algorithm}</div>
                                        <div className="text-slate-500">MAE (Error):</div>
                                        <div className="text-slate-200 font-medium text-right">${metrics.mae.toFixed(2)}</div>
                                        <div className="text-slate-500">RMSE:</div>
                                        <div className="text-slate-200 font-medium text-right">${metrics.rmse.toFixed(2)}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 mb-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-slate-100">Revenue Forecast Trend</h2>
                                <div className="flex items-center space-x-4 text-sm">
                                    <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-slate-400 mr-2"></div> Historical</div>
                                    <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div> Predicted</div>
                                </div>
                            </div>
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 25 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#94a3b8', fontSize: 12 }} 
                                            angle={-45}
                                            textAnchor="end"
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#94a3b8' }} 
                                            width={80} 
                                            tickFormatter={(val) => `$${val}`} 
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', color: '#f8fafc' }}
                                            formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, '']}
                                        />
                                        
                                        <Line 
                                            type="monotone" 
                                            dataKey="Historical" 
                                            stroke="#94a3b8" 
                                            strokeWidth={3} 
                                            dot={{ r: 3, fill: '#94a3b8', strokeWidth: 0 }} 
                                            activeDot={{ r: 5, fill: '#f8fafc' }} 
                                            connectNulls={true}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="Predicted" 
                                            stroke="#6366f1" 
                                            strokeWidth={3} 
                                            strokeDasharray="5 5"
                                            dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} 
                                            activeDot={{ r: 5, fill: '#818cf8' }} 
                                            connectNulls={true}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                            <h3 className="text-md font-semibold text-slate-300 mb-2 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Forecast Insights
                            </h3>
                            <p className="text-slate-400 text-sm">
                                {stats.predictedRevenue > stats.historicalRevenue 
                                    ? `Predicted revenue for the next ${forecastDays} days ($${stats.predictedRevenue.toFixed(2)}) is higher than the recent historical average. Prepare inventory for an upward trend.`
                                    : `Predicted revenue for the next ${forecastDays} days ($${stats.predictedRevenue.toFixed(2)}) is expected to be stable or slightly lower. Monitor slow-moving stock.`}
                            </p>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default Forecast;
