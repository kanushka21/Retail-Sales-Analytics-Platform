import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

const Dashboard = ({ setAuth }) => {
    const [message, setMessage] = useState('');
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProtectedData = async () => {
            try {
                const response = await api.get('accounts/test/');
                setMessage(response.data.message);
                setUserData(response.data.user);
            } catch (err) {
                console.error("Failed to fetch protected data:", err);
                if (err.response && err.response.status === 401) {
                    handleLogout();
                }
            }
        };

        fetchProtectedData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setAuth(false);
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <nav className="bg-white shadow-sm border-b border-slate-200 px-8 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                        RA
                    </div>
                    <span className="text-xl font-bold text-slate-800 tracking-tight">Retail Analytics Dashboard</span>
                </div>
                <div className="hidden md:flex space-x-8 mr-auto ml-10">
                    <Link to="/dashboard" className="text-indigo-600 font-medium border-b-2 border-indigo-600 pb-1">Dashboard</Link>
                    <Link to="/sales/new" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">POS</Link>
                    <Link to="/sales" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">Sales History</Link>
                    <Link to="/products" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">Products</Link>
                    <Link to="/inventory" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">Inventory</Link>
                    <Link to="/customers" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">Customers</Link>
                </div>
                <div className="flex items-center space-x-6">
                    {userData && (
                        <div className="text-right">
                            <p className="text-sm font-semibold text-slate-800">{userData.first_name} {userData.last_name}</p>
                            <p className="text-xs text-indigo-600 font-medium bg-indigo-50 inline-block px-2 py-0.5 rounded-full mt-1">Role: {userData.role}</p>
                        </div>
                    )}
                    <button 
                        onClick={handleLogout}
                        className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-colors duration-200 shadow-sm"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-8 py-12">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900">Welcome Back{userData ? `, ${userData.username}` : ''}</h1>
                    <p className="text-slate-500 mt-2">Here's what's happening with your store today.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {/* Placeholder Stat Cards */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <h3 className="text-sm font-medium text-slate-500 mb-2">Total Sales Today</h3>
                        <p className="text-3xl font-bold text-slate-900">$24,500.00</p>
                        <div className="mt-4 flex items-center text-sm text-emerald-600 font-medium">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                            +12% from yesterday
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <h3 className="text-sm font-medium text-slate-500 mb-2">Active Orders</h3>
                        <p className="text-3xl font-bold text-slate-900">142</p>
                        <div className="mt-4 flex items-center text-sm text-emerald-600 font-medium">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                            +5% from yesterday
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <h3 className="text-sm font-medium text-slate-500 mb-2">New Customers</h3>
                        <p className="text-3xl font-bold text-slate-900">28</p>
                        <div className="mt-4 flex items-center text-sm text-rose-600 font-medium">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
                            -2% from yesterday
                        </div>
                    </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70"></div>
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold text-indigo-900 mb-2">API Connection Status</h2>
                        <div className="flex items-center space-x-3">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <p className="text-indigo-800 font-medium">{message || "Connecting to protected endpoint..."}</p>
                        </div>
                        {userData && (
                            <div className="mt-6 p-4 bg-white/60 rounded-xl border border-indigo-100/50 backdrop-blur-sm">
                                <p className="text-sm font-mono text-indigo-900/80 break-all">
                                    <span className="font-bold">Verified Identity: </span> 
                                    {JSON.stringify(userData)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
