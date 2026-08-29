import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import saleService from '../services/saleService';

function SalesHistory() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const data = await saleService.getSales();
            setSales(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch sales history.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-800">Sales History</h1>
                </div>

                {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}

                <div className="bg-white rounded shadow overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading sales...</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                                    <th className="p-4 font-semibold">Sale ID</th>
                                    <th className="p-4 font-semibold">Date</th>
                                    <th className="p-4 font-semibold">Customer</th>
                                    <th className="p-4 font-semibold">Subtotal</th>
                                    <th className="p-4 font-semibold">Discount</th>
                                    <th className="p-4 font-semibold">Total</th>
                                    <th className="p-4 font-semibold">Payment Method</th>
                                    <th className="p-4 font-semibold">Cashier</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-slate-500">
                                            No sales found.
                                        </td>
                                    </tr>
                                ) : (
                                    sales.map(sale => (
                                        <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-medium">#{sale.id}</td>
                                            <td className="p-4">{new Date(sale.sale_date).toLocaleString()}</td>
                                            <td className="p-4">{sale.customer_name || 'Walk-in Guest'}</td>
                                            <td className="p-4">${parseFloat(sale.subtotal).toFixed(2)}</td>
                                            <td className="p-4">${parseFloat(sale.discount).toFixed(2)}</td>
                                            <td className="p-4 font-bold text-slate-800">${parseFloat(sale.total_amount).toFixed(2)}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">
                                                    {sale.payment_method}
                                                </span>
                                            </td>
                                            <td className="p-4">{sale.created_by_username}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                </div>
            </div>
        </div>
    );
}

export default SalesHistory;
