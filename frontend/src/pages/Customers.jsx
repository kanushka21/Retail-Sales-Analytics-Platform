import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { 
    getCustomers, 
    getCustomer, 
    createCustomer, 
    updateCustomer, 
    deleteCustomer 
} from '../services/customerService';

function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filtering and Search
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        address: '',
    });
    const [formErrors, setFormErrors] = useState(null);

    // Initial load
    useEffect(() => {
        fetchCustomers();
    }, []);

    // Load customers when filters change
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchCustomers();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const data = await getCustomers(searchTerm);
            setCustomers(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch customers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const openAddModal = () => {
        setEditingCustomer(null);
        setFormData({
            full_name: '',
            email: '',
            phone: '',
            address: '',
        });
        setFormErrors(null);
        setIsModalOpen(true);
    };

    const openEditModal = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            full_name: customer.full_name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address || '',
        });
        setFormErrors(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormErrors(null);
        try {
            const payload = { ...formData };
            if (editingCustomer) {
                await updateCustomer(editingCustomer.id, payload);
            } else {
                await createCustomer(payload);
            }
            setIsModalOpen(false);
            fetchCustomers(); // Refresh list
        } catch (err) {
            if (err.response && err.response.data) {
                setFormErrors(err.response.data);
            } else {
                setFormErrors({ non_field_errors: ['An unexpected error occurred.'] });
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this customer?")) {
            try {
                await deleteCustomer(id);
                fetchCustomers(); // Refresh list
            } catch (err) {
                alert("Failed to delete customer.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-800">Customer Management</h1>
                    <button 
                        onClick={openAddModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow transition-colors"
                    >
                        + Add Customer
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded shadow mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <input 
                            type="text" 
                            placeholder="Search Customers by Name, Email, or Phone..." 
                            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}

                {/* Data Table */}
                <div className="bg-white rounded shadow overflow-x-auto">
                    {loading && customers.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Loading customers...</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Email</th>
                                    <th className="p-4 font-semibold">Phone</th>
                                    <th className="p-4 font-semibold">Address</th>
                                    <th className="p-4 font-semibold">Created Date</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-slate-500">
                                            No customers found. Try adjusting your search or add a new customer.
                                        </td>
                                    </tr>
                                ) : (
                                    customers.map(customer => (
                                        <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-medium text-slate-800">{customer.full_name}</td>
                                            <td className="p-4 text-slate-600">{customer.email}</td>
                                            <td className="p-4 text-slate-600">{customer.phone}</td>
                                            <td className="p-4 text-slate-600 max-w-xs truncate">{customer.address}</td>
                                            <td className="p-4 text-slate-500">{new Date(customer.created_at).toLocaleDateString()}</td>
                                            <td className="p-4 text-right space-x-2">
                                                <button 
                                                    onClick={() => openEditModal(customer)}
                                                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(customer.id)}
                                                    className="text-red-600 hover:text-red-800 font-medium"
                                                >
                                                    Delete
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

            {/* Modal for Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-800">
                                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                            </h2>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-2xl"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            {formErrors && formErrors.non_field_errors && (
                                <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">
                                    {formErrors.non_field_errors.join(' ')}
                                </div>
                            )}
                            
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Full Name *</label>
                                    <input 
                                        type="text" 
                                        name="full_name"
                                        required
                                        value={formData.full_name}
                                        onChange={handleInputChange}
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {formErrors && formErrors.full_name && <p className="text-red-500 text-sm mt-1">{formErrors.full_name}</p>}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-700 font-medium mb-1">Email *</label>
                                        <input 
                                            type="email" 
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {formErrors && formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-medium mb-1">Phone *</label>
                                        <input 
                                            type="text" 
                                            name="phone"
                                            required
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {formErrors && formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Address *</label>
                                    <textarea 
                                        name="address"
                                        required
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    ></textarea>
                                    {formErrors && formErrors.address && <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>}
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-end space-x-3 border-t border-slate-200 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                >
                                    {editingCustomer ? 'Save Changes' : 'Create Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}

export default Customers;
