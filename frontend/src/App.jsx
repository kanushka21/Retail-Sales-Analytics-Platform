import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';

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
            </Routes>
        </Router>
    );
}

export default App;
