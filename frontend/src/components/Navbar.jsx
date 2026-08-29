import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ setAuth, userData }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (setAuth) setAuth(false);
        navigate('/');
    };

    const navLinks = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/sales/new', label: 'POS' },
        { path: '/sales', label: 'Sales History' },
        { path: '/products', label: 'Products' },
        { path: '/inventory', label: 'Inventory' },
        { path: '/customers', label: 'Customers' },
        { path: '/suppliers', label: 'Suppliers' },
        { path: '/reports', label: 'Reports' },
        { path: '/forecast', label: 'Forecast' },
    ];

    return (
        <nav className="bg-slate-800 shadow-sm border-b border-slate-700 px-4 md:px-8 py-4 flex justify-between items-center text-white">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                    RA
                </div>
                <span className="text-xl font-bold text-slate-100 tracking-tight hidden sm:inline">Retail Analytics</span>
            </div>
            
            <div className="hidden md:flex space-x-4 lg:space-x-6 mr-auto ml-10 overflow-x-auto">
                {navLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`font-medium whitespace-nowrap transition-colors ${
                                isActive 
                                    ? 'text-indigo-400 border-b-2 border-indigo-400 pb-1' 
                                    : 'text-slate-400 hover:text-indigo-400'
                            }`}
                        >
                            {link.label}
                        </Link>
                    );
                })}
            </div>

            <div className="flex items-center space-x-4 lg:space-x-6">
                {userData && (
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-200">{userData.first_name} {userData.last_name}</p>
                        <p className="text-xs text-indigo-400 font-medium bg-indigo-900/50 inline-block px-2 py-0.5 rounded-full mt-1 border border-indigo-500/30">
                            {userData.role}
                        </p>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 text-slate-200 font-medium rounded-lg hover:bg-slate-600 hover:text-red-400 hover:border-red-400/50 transition-colors shadow-sm whitespace-nowrap"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
