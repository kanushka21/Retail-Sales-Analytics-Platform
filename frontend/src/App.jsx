import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import SalesHistory from './pages/SalesHistory';
import Reports from './pages/Reports';
import Forecast from './pages/Forecast';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simple auth check for Day 2
        const token = localStorage.getItem('access_token');
        if (token) {
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>;
    }

    return (
        <Router>
            <Routes>
                <Route 
                    path="/" 
                    element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login setAuth={setIsAuthenticated} />} 
                />
                <Route 
                    path="/signup" 
                    element={isAuthenticated ? <Navigate to="/dashboard" /> : <Signup />} 
                />
                <Route 
                    path="/dashboard" 
                    element={isAuthenticated ? <Dashboard setAuth={setIsAuthenticated} /> : <Navigate to="/" />} 
                />
                <Route 
                    path="/products" 
                    element={isAuthenticated ? <Products /> : <Navigate to="/" />} 
                />
                <Route 
                    path="/customers" 
                    element={isAuthenticated ? <Customers /> : <Navigate to="/" />} 
                />
                <Route 
                    path="/suppliers" 
                    element={isAuthenticated ? <Suppliers /> : <Navigate to="/" />} 
                />
                <Route 
                    path="/inventory" 
                    element={isAuthenticated ? <Inventory /> : <Navigate to="/" />} 
                />
                <Route 
                    path="/sales/new" 
                    element={isAuthenticated ? <POS /> : <Navigate to="/" />} 
                />
                <Route 
                    path="/sales" 
                    element={isAuthenticated ? <SalesHistory /> : <Navigate to="/" />} 
                />
                <Route 
                    path="/reports" 
                    element={isAuthenticated ? <Reports /> : <Navigate to="/" />} 
                />
                <Route 
                    path="/forecast" 
                    element={isAuthenticated ? <Forecast /> : <Navigate to="/" />} 
                />
            </Routes>
        </Router>
    );
}

export default App;
