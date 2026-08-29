import React, { useState, useEffect } from 'react';
import { 
    getSuppliers, 
    getSupplier, 
    createSupplier, 
    updateSupplier, 
    deleteSupplier 
} from '../services/supplierService';
import Navbar from '../components/Navbar';

function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filtering and Search
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [formData, setFormData] = useState({
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
    });
    const [formErrors, setFormErrors] = useState(null);

    // Initial load
    useEffect(() => {
        fetchSuppliers();
    }, []);

    // Load suppliers when filters change
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchSuppliers();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const data = await getSuppliers(searchTerm);
            setSuppliers(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch suppliers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const openAddModal = () => {
        setEditingSupplier(null);
        setFormData({
            company_name: '',
            contact_person: '',
            email: '',
            phone: '',
            address: '',
        });
        setFormErrors(null);
        setIsModalOpen(true);
    };

    const openEditModal = (supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            company_name: supplier.company_name,
            contact_person: supplier.contact_person,
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.address || '',
        });
        setFormErrors(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormErrors(null);
        try {
            const payload = { ...formData };
            if (editingSupplier) {
                await updateSupplier(editingSupplier.id, payload);
            } else {
                await createSupplier(payload);
            }
            setIsModalOpen(false);
            fetchSuppliers(); // Refresh list
        } catch (err) {
            if (err.response && err.response.data) {
                setFormErrors(err.response.data);
            } else {
                setFormErrors({ non_field_errors: ['An unexpected error occurred.'] });
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this supplier?")) {
            try {
                await deleteSupplier(id);
                fetchSuppliers(); // Refresh list
            } catch (err) {
                alert("Failed to delete supplier.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-800">Supplier Management</h1>
                    <button 
                        onClick={openAddModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow transition-colors"
                    >
                        + Add Supplier
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded shadow mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <input 
                            type="text" 
                            placeholder="Search Suppliers by Company, Name, Email, or Phone..." 
                            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}

                {/* Data Table */}
                <div className="bg-white rounded shadow overflow-x-auto">
                    {loading && suppliers.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Loading suppliers...</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                                    <th className="p-4 font-semibold">Company Name</th>
                                    <th className="p-4 font-semibold">Contact Person</th>
                                    <th className="p-4 font-semibold">Email</th>
                                    <th className="p-4 font-semibold">Phone</th>
                                    <th className="p-4 font-semibold">Address</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-slate-500">
                                            No suppliers found. Try adjusting your search or add a new supplier.
                                        </td>
                                    </tr>
                                ) : (
                                    suppliers.map(supplier => (
                                        <tr key={supplier.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-medium text-slate-800">{supplier.company_name}</td>
                                            <td className="p-4 text-slate-600">{supplier.contact_person}</td>
                                            <td className="p-4 text-slate-600">{supplier.email}</td>
                                            <td className="p-4 text-slate-600">{supplier.phone}</td>
                                            <td className="p-4 text-slate-600 max-w-xs truncate">{supplier.address}</td>
                                            <td className="p-4 text-right space-x-2">
                                                <button 
                                                    onClick={() => openEditModal(supplier)}
                                                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(supplier.id)}
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
            </main>

            {/* Modal for Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-800">
                                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-4">
                            {formErrors && formErrors.non_field_errors && (
                                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm">
                                    {formErrors.non_field_errors.join(' ')}
                                </div>
                            )}
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                                    <input 
                                        type="text" 
                                        name="company_name"
                                        required
                                        value={formData.company_name}
                                        onChange={handleInputChange}
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {formErrors && formErrors.company_name && <p className="text-red-500 text-xs mt-1">{formErrors.company_name.join(' ')}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person *</label>
                                    <input 
                                        type="text" 
                                        name="contact_person"
                                        required
                                        value={formData.contact_person}
                                        onChange={handleInputChange}
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {formErrors && formErrors.contact_person && <p className="text-red-500 text-xs mt-1">{formErrors.contact_person.join(' ')}</p>}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                                    <input 
                                        type="email" 
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {formErrors && formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email.join(' ')}</p>}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                                    <input 
                                        type="text" 
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {formErrors && formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone.join(' ')}</p>}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                    <textarea 
                                        name="address"
                                        rows="3"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    ></textarea>
                                    {formErrors && formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address.join(' ')}</p>}
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-end space-x-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                >
                                    {editingSupplier ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Suppliers;
