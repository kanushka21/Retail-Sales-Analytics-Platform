import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInventory, addStock, removeStock } from '../services/inventoryService';

function Inventory() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filtering and Search
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    
    // Summary Cards Data
    const [summary, setSummary] = useState({
        totalProducts: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0
    });

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState(''); // 'add' or 'remove'
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({
        quantity: '',
        reason: ''
    });
    const [formErrors, setFormErrors] = useState(null);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchInventory();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, statusFilter]);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (statusFilter) params.status = statusFilter;
            
            const data = await getInventory(params);
            setInventory(data);
            
            // If no filters are applied, update summary cards
            if (!searchTerm && !statusFilter) {
                calculateSummary(data);
            }
            setError(null);
        } catch (err) {
            console.error("Failed to fetch inventory", err);
            setError('Failed to load inventory data.');
        } finally {
            setLoading(false);
        }
    };

    const calculateSummary = (data) => {
        let inStock = 0;
        let lowStock = 0;
        let outOfStock = 0;

        data.forEach(item => {
            if (item.quantity <= 0) outOfStock++;
            else if (item.quantity <= item.minimum_stock_level) lowStock++;
            else inStock++;
        });

        setSummary({
            totalProducts: data.length,
            inStock,
            lowStock,
            outOfStock
        });
    };

    const openModal = (item, mode) => {
        setSelectedItem(item);
        setModalMode(mode);
        setFormData({ quantity: '', reason: '' });
        setFormErrors(null);
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormErrors(null);
        
        try {
            const payload = {
                quantity: parseInt(formData.quantity),
                reason: formData.reason
            };
            
            if (modalMode === 'add') {
                await addStock(selectedItem.id, payload);
            } else if (modalMode === 'remove') {
                await removeStock(selectedItem.id, payload);
            }
            
            setIsModalOpen(false);
            fetchInventory(); // Refresh the data
        } catch (err) {
            if (err.response && err.response.data) {
                setFormErrors(err.response.data);
            } else {
                setFormErrors({ non_field_errors: ['An unexpected error occurred.'] });
            }
        }
    };

    const getStatusBadge = (quantity, min) => {
        if (quantity <= 0) {
            return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">Out of Stock</span>;
        } else if (quantity <= min) {
            return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">Low Stock</span>;
        } else {
            return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">In Stock</span>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mb-2 inline-block">&larr; Back to Dashboard</Link>
                        <h1 className="text-3xl font-bold text-slate-800">Inventory Management</h1>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded shadow border-l-4 border-indigo-500">
                        <p className="text-sm text-slate-500 font-medium">Total Products</p>
                        <p className="text-2xl font-bold text-slate-800">{summary.totalProducts}</p>
                    </div>
                    <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
                        <p className="text-sm text-slate-500 font-medium">In Stock</p>
                        <p className="text-2xl font-bold text-slate-800">{summary.inStock}</p>
                    </div>
                    <div className="bg-white p-4 rounded shadow border-l-4 border-yellow-500">
                        <p className="text-sm text-slate-500 font-medium">Low Stock</p>
                        <p className="text-2xl font-bold text-slate-800">{summary.lowStock}</p>
                    </div>
                    <div className="bg-white p-4 rounded shadow border-l-4 border-red-500">
                        <p className="text-sm text-slate-500 font-medium">Out of Stock</p>
                        <p className="text-2xl font-bold text-slate-800">{summary.outOfStock}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded shadow mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <input 
                            type="text" 
                            placeholder="Search Inventory by Name, SKU, or Barcode..." 
                            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="sm:w-64">
                        <select 
                            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="in_stock">In Stock</option>
                            <option value="low">Low Stock</option>
                            <option value="out">Out of Stock</option>
                        </select>
                    </div>
                </div>

                {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}

                {/* Data Table */}
                <div className="bg-white rounded shadow overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading inventory...</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                                    <th className="p-4 font-semibold">Product</th>
                                    <th className="p-4 font-semibold">SKU</th>
                                    <th className="p-4 font-semibold">Category</th>
                                    <th className="p-4 font-semibold">Current Stock</th>
                                    <th className="p-4 font-semibold">Min. Level</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold">Last Updated</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-slate-500">
                                            No inventory items found.
                                        </td>
                                    </tr>
                                ) : (
                                    inventory.map(item => (
                                        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="p-4">{item.product_name}</td>
                                            <td className="p-4 text-slate-500">{item.product_sku}</td>
                                            <td className="p-4">{item.category_name || '-'}</td>
                                            <td className="p-4 font-bold">{item.quantity}</td>
                                            <td className="p-4 text-slate-500">{item.minimum_stock_level}</td>
                                            <td className="p-4">
                                                {getStatusBadge(item.quantity, item.minimum_stock_level)}
                                            </td>
                                            <td className="p-4 text-sm text-slate-500">
                                                {new Date(item.last_updated).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button 
                                                    onClick={() => openModal(item, 'add')}
                                                    className="text-green-600 hover:text-green-800 font-medium"
                                                >
                                                    Add
                                                </button>
                                                <button 
                                                    onClick={() => openModal(item, 'remove')}
                                                    className="text-red-600 hover:text-red-800 font-medium"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal for Add/Remove Stock */}
            {isModalOpen && selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">
                                {modalMode === 'add' ? 'Add Stock' : 'Remove Stock'}
                            </h2>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-2xl"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="mb-4">
                                <p className="text-sm text-slate-500">Product: <span className="font-semibold text-slate-800">{selectedItem.product_name}</span></p>
                                <p className="text-sm text-slate-500">Current Stock: <span className="font-semibold text-slate-800">{selectedItem.quantity}</span></p>
                            </div>

                            {formErrors && formErrors.non_field_errors && (
                                <div className="mb-4 bg-red-100 text-red-700 p-3 rounded text-sm">
                                    {formErrors.non_field_errors.join(' ')}
                                </div>
                            )}
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">
                                        Quantity to {modalMode === 'add' ? 'Add' : 'Remove'} *
                                    </label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        name="quantity"
                                        required
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {formErrors && formErrors.quantity && <p className="text-red-500 text-sm mt-1">{formErrors.quantity}</p>}
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Reason (Optional)</label>
                                    <input 
                                        type="text" 
                                        name="reason"
                                        placeholder={modalMode === 'add' ? "e.g., Supplier Delivery" : "e.g., Damaged Item"}
                                        value={formData.reason}
                                        onChange={handleInputChange}
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {formErrors && formErrors.reason && <p className="text-red-500 text-sm mt-1">{formErrors.reason}</p>}
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-200">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className={`px-4 py-2 text-white rounded transition-colors ${
                                        modalMode === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                >
                                    {modalMode === 'add' ? 'Add Stock' : 'Remove Stock'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Inventory;
