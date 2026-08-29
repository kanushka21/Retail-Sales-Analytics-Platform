import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { 
    getProducts, 
    getProduct, 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    getCategories 
} from '../services/productService';

function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filtering and Search
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        barcode: '',
        description: '',
        category: '',
        cost_price: 0,
        selling_price: 0,
        current_stock: 0,
        minimum_stock_level: 0,
    });
    const [formErrors, setFormErrors] = useState(null);

    // Initial load
    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, []);

    // Load products when filters change
    useEffect(() => {
        // debounce can be added here for production
        const delayDebounceFn = setTimeout(() => {
            fetchProducts();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, categoryFilter]);

    const fetchCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (err) {
            console.error("Failed to load categories", err);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await getProducts(searchTerm, categoryFilter);
            setProducts(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch products. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            sku: '',
            barcode: '',
            description: '',
            category: '',
            cost_price: 0,
            selling_price: 0,
            current_stock: 0,
            minimum_stock_level: 0,
        });
        setFormErrors(null);
        setIsModalOpen(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            sku: product.sku,
            barcode: product.barcode || '',
            description: product.description || '',
            category: product.category || '',
            cost_price: product.cost_price,
            selling_price: product.selling_price,
            current_stock: product.current_stock,
            minimum_stock_level: product.minimum_stock_level,
        });
        setFormErrors(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormErrors(null);
        try {
            // format data if needed
            const payload = { ...formData };
            if (!payload.category) payload.category = null;
            if (!payload.barcode) payload.barcode = null;

            if (editingProduct) {
                await updateProduct(editingProduct.id, payload);
            } else {
                await createProduct(payload);
            }
            setIsModalOpen(false);
            fetchProducts(); // Refresh list
        } catch (err) {
            if (err.response && err.response.data) {
                setFormErrors(err.response.data);
            } else {
                setFormErrors({ non_field_errors: ['An unexpected error occurred.'] });
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await deleteProduct(id);
                fetchProducts(); // Refresh list
            } catch (err) {
                alert("Failed to delete product.");
            }
        }
    };

    const getStockStatus = (current, min) => {
        if (current <= 0) {
            return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">Out of Stock</span>;
        } else if (current <= min) {
            return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">Low Stock</span>;
        } else {
            return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">In Stock</span>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-800">Product Management</h1>
                    <button 
                        onClick={openAddModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow transition-colors"
                    >
                        + Add Product
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded shadow mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <input 
                            type="text" 
                            placeholder="Search Products by Name, SKU, or Barcode..." 
                            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="sm:w-64">
                        <select 
                            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}

                {/* Data Table */}
                <div className="bg-white rounded shadow overflow-x-auto">
                    {loading && products.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Loading products...</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                                    <th className="p-4 font-semibold">Product Name</th>
                                    <th className="p-4 font-semibold">SKU</th>
                                    <th className="p-4 font-semibold">Category</th>
                                    <th className="p-4 font-semibold">Cost Price</th>
                                    <th className="p-4 font-semibold">Selling Price</th>
                                    <th className="p-4 font-semibold">Current Stock</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-slate-500">
                                            No products found. Try adjusting your search or add a new product.
                                        </td>
                                    </tr>
                                ) : (
                                    products.map(product => (
                                        <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="p-4">{product.name}</td>
                                            <td className="p-4 text-slate-500">{product.sku}</td>
                                            <td className="p-4">{product.category_name || '-'}</td>
                                            <td className="p-4">${product.cost_price}</td>
                                            <td className="p-4">${product.selling_price}</td>
                                            <td className="p-4">{product.current_stock}</td>
                                            <td className="p-4">
                                                {getStockStatus(product.current_stock, product.minimum_stock_level)}
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button 
                                                    onClick={() => openEditModal(product)}
                                                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(product.id)}
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
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
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
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Product Name *</label>
                                    <input 
                                        type="text" 
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {formErrors && formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">SKU *</label>
                                    <input 
                                        type="text" 
                                        name="sku"
                                        required
                                        value={formData.sku}
                                        onChange={handleInputChange}
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {formErrors && formErrors.sku && <p className="text-red-500 text-sm mt-1">{formErrors.sku}</p>}
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Barcode</label>
                                    <input 
                                        type="text" 
                                        name="barcode"
                                        value={formData.barcode}
                                        onChange={handleInputChange}
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {formErrors && formErrors.barcode && <p className="text-red-500 text-sm mt-1">{formErrors.barcode}</p>}
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Category</label>
                                    <select 
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Select a Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    {formErrors && formErrors.category && <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>}
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-slate-700 font-medium mb-1">Description</label>
                                    <textarea 
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Cost Price *</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        min="0"
                                        name="cost_price"
                                        required
                                        value={formData.cost_price}
                                        onChange={handleInputChange}
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {formErrors && formErrors.cost_price && <p className="text-red-500 text-sm mt-1">{formErrors.cost_price}</p>}
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Selling Price *</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        min="0"
                                        name="selling_price"
                                        required
                                        value={formData.selling_price}
                                        onChange={handleInputChange}
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {formErrors && formErrors.selling_price && <p className="text-red-500 text-sm mt-1">{formErrors.selling_price}</p>}
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Current Stock *</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        name="current_stock"
                                        required
                                        value={formData.current_stock}
                                        onChange={handleInputChange}
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {formErrors && formErrors.current_stock && <p className="text-red-500 text-sm mt-1">{formErrors.current_stock}</p>}
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Min Stock Level *</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        name="minimum_stock_level"
                                        required
                                        value={formData.minimum_stock_level}
                                        onChange={handleInputChange}
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {formErrors && formErrors.minimum_stock_level && <p className="text-red-500 text-sm mt-1">{formErrors.minimum_stock_level}</p>}
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
                                    {editingProduct ? 'Save Changes' : 'Create Product'}
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

export default Products;
