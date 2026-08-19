import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/productService';
import { getCustomers } from '../services/customerService';
import saleService from '../services/saleService';

function POS() {
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Cart state
    const [cart, setCart] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    
    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchProducts();
        fetchCustomers();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchProducts(searchTerm);
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchProducts = async (search = '') => {
        try {
            // Only fetch active products. If backend supports status filter, use it. 
            // We fetch all products and filter out out_of_stock products if needed, 
            // but requirements say "Only show active products. Clearly indicate Out of Stock status. Do not allow out-of-stock products to be added to the cart."
            const data = await getProducts(search);
            setProducts(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchCustomers = async () => {
        try {
            const data = await getCustomers();
            setCustomers(data);
        } catch (err) {
            console.error(err);
        }
    };

    const addToCart = (product) => {
        if (product.current_stock <= 0) return;
        
        const existingItem = cart.find(item => item.product.id === product.id);
        if (existingItem) {
            if (existingItem.quantity >= product.current_stock) {
                alert("Cannot add more than available stock.");
                return;
            }
            setCart(cart.map(item => 
                item.product.id === product.id 
                    ? { ...item, quantity: item.quantity + 1 } 
                    : item
            ));
        } else {
            setCart([...cart, { product, quantity: 1 }]);
        }
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) return;
        
        const item = cart.find(i => i.product.id === productId);
        if (item && newQuantity > item.product.current_stock) {
            alert("Cannot exceed available stock.");
            return;
        }
        
        setCart(cart.map(item => 
            item.product.id === productId 
                ? { ...item, quantity: newQuantity } 
                : item
        ));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product.id !== productId));
    };

    const calculateSubtotal = () => {
        return cart.reduce((total, item) => total + (item.product.selling_price * item.quantity), 0);
    };

    const subtotal = calculateSubtotal();
    const finalTotal = Math.max(0, subtotal - parseFloat(discount || 0));

    const handleCompleteSale = async () => {
        if (cart.length === 0) {
            setError("Cart is empty.");
            return;
        }
        if (discount < 0) {
            setError("Discount cannot be negative.");
            return;
        }
        
        setLoading(true);
        setError(null);
        setSuccessMessage('');
        
        const payload = {
            customer: selectedCustomer || null,
            discount: parseFloat(discount || 0),
            payment_method: paymentMethod,
            items: cart.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity
            }))
        };
        
        try {
            const res = await saleService.createSale(payload);
            setSuccessMessage(`Sale #${res.id} completed successfully!`);
            setCart([]);
            setSelectedCustomer('');
            setDiscount(0);
            setPaymentMethod('CASH');
            fetchProducts(searchTerm); // Refresh stock
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data) {
                const errData = err.response.data;
                const messages = [];
                if (errData.error) messages.push(errData.error);
                if (typeof errData === 'object') {
                    Object.values(errData).forEach(val => {
                        if (Array.isArray(val)) messages.push(...val);
                    });
                }
                setError(messages.join(' ') || "Failed to complete sale.");
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
                
                {/* Left Side: Product List */}
                <div className="w-full lg:w-2/3 bg-white p-6 rounded shadow flex flex-col h-[85vh]">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Products</h2>
                    <input 
                        type="text" 
                        placeholder="Search by name, SKU, or barcode..." 
                        className="w-full border border-slate-300 rounded px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    
                    <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {products.map(product => (
                            <div 
                                key={product.id} 
                                className={`border rounded p-4 flex flex-col justify-between ${product.current_stock <= 0 ? 'bg-slate-100 opacity-60' : 'hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer'}`}
                                onClick={() => addToCart(product)}
                            >
                                <div>
                                    <h3 className="font-semibold text-slate-800 text-lg">{product.name}</h3>
                                    <p className="text-sm text-slate-500">SKU: {product.sku}</p>
                                </div>
                                <div className="mt-4 flex justify-between items-center">
                                    <span className="font-bold text-indigo-700">${product.selling_price}</span>
                                    {product.current_stock > 0 ? (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Stock: {product.current_stock}</span>
                                    ) : (
                                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Out of Stock</span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {products.length === 0 && (
                            <div className="col-span-full text-center text-slate-500 py-8">No products found.</div>
                        )}
                    </div>
                </div>

                {/* Right Side: Cart */}
                <div className="w-full lg:w-1/3 bg-white p-6 rounded shadow flex flex-col h-[85vh]">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Current Sale</h2>
                    
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
                    {successMessage && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">{successMessage}</div>}
                    
                    {/* Customer Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Customer (Optional)</label>
                        <select 
                            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={selectedCustomer}
                            onChange={(e) => setSelectedCustomer(e.target.value)}
                        >
                            <option value="">Walk-in Customer</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.full_name} ({c.phone})</option>
                            ))}
                        </select>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto border-t border-b border-slate-200 py-4 mb-4">
                        {cart.length === 0 ? (
                            <div className="text-center text-slate-500 mt-10">Cart is empty</div>
                        ) : (
                            <ul className="space-y-4">
                                {cart.map(item => (
                                    <li key={item.product.id} className="flex flex-col">
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-slate-800">{item.product.name}</span>
                                            <span className="font-semibold text-slate-800">${(item.product.selling_price * item.quantity).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="flex items-center space-x-2">
                                                <button 
                                                    className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center hover:bg-slate-300"
                                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                >-</button>
                                                <span className="w-8 text-center">{item.quantity}</span>
                                                <button 
                                                    className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center hover:bg-slate-300"
                                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                >+</button>
                                            </div>
                                            <span className="text-sm text-slate-500">@ ${item.product.selling_price}/ea</span>
                                            <button 
                                                className="text-red-500 text-sm hover:underline"
                                                onClick={() => removeFromCart(item.product.id)}
                                            >Remove</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Totals & Checkout */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-slate-600">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                            <span>Discount</span>
                            <div className="flex items-center">
                                <span className="mr-1">$</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    step="0.01"
                                    className="w-20 border border-slate-300 rounded px-2 py-1 text-right"
                                    value={discount}
                                    onChange={(e) => setDiscount(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-between font-bold text-xl text-slate-800 border-t pt-2">
                            <span>Total</span>
                            <span>${finalTotal.toFixed(2)}</span>
                        </div>
                        
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                            <select 
                                className="w-full border border-slate-300 rounded px-3 py-2 mb-4"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            >
                                <option value="CASH">Cash</option>
                                <option value="CARD">Card</option>
                                <option value="ONLINE">Online Transfer</option>
                            </select>
                        </div>

                        <button 
                            className={`w-full py-3 rounded text-white font-bold text-lg transition-colors ${loading || cart.length === 0 ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'}`}
                            onClick={handleCompleteSale}
                            disabled={loading || cart.length === 0}
                        >
                            {loading ? 'Processing...' : 'Complete Sale'}
                        </button>
                    </div>
                </div>
                
            </div>
        </div>
    );
}

export default POS;
