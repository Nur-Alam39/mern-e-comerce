import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from '../utils/api';
import { useSettings } from '../hooks/useSettings';

export default function AdminOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { formatPrice } = useSettings();
    const [order, setOrder] = useState(null);
    const [products, setProducts] = useState({});
    const [shipments, setShipments] = useState([]);
    const [providers, setProviders] = useState([]);
    const [selectedProvider, setSelectedProvider] = useState('');
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [expandedShipments, setExpandedShipments] = useState(new Set());
    const [showPaymentResponse, setShowPaymentResponse] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [newQty, setNewQty] = useState('');
    const [showAddItem, setShowAddItem] = useState(false);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [productVariations, setProductVariations] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedVariation, setSelectedVariation] = useState('');
    const [addQty, setAddQty] = useState(1);
    const [editingAddress, setEditingAddress] = useState(false);
    const [addressForm, setAddressForm] = useState({});

    useEffect(() => {
        loadOrder();
    }, [id]);

    const loadOrder = async () => {
        try {
            const res = await axios.get('/api/orders');
            const orders = Array.isArray(res.data) ? res.data : [];
            const found = orders.find(o => o._id === id);
            if (found) {
                setOrder(found);
                setNewStatus(found.status || 'pending');
                // load shipments for this order
                try {
                    const sres = await axios.get(`/api/couriers?orderId=${found._id}`);
                    setShipments(sres.data && sres.data.shipments ? sres.data.shipments : []);
                } catch (err) { console.log('Failed to load shipments', err); }
                // Load product details for each item
                if (found.items) {
                    const prods = {};
                    for (const item of found.items) {
                        if (item.product && item.product._id) {
                            try {
                                const pRes = await axios.get(`/api/products/${item.product._id}`);
                                prods[item.product._id] = pRes.data;
                            } catch (err) {
                                console.log('Failed to load product', err);
                                // Product may have been deleted, store a placeholder
                                prods[item.product._id] = { stock: 'N/A', name: item.name };
                            }
                        } else if (typeof item.product === 'string') {
                            try {
                                const pRes = await axios.get(`/api/products/${item.product}`);
                                prods[item.product] = pRes.data;
                            } catch (err) {
                                console.log('Failed to load product', err);
                                prods[item.product] = { stock: 'N/A', name: item.name };
                            }
                        }
                    }
                    setProducts(prods);
                }
            }
        } catch (err) {
            console.log('Failed to load order', err);
        } finally {
            setLoading(false);
        }
    };

    // load available courier providers from settings
    useEffect(() => {
        (async () => {
            try {
                const res = await axios.get('/api/settings');
                const cps = res.data && res.data.courierProviders ? res.data.courierProviders.filter(c => c.enabled) : [];
                setProviders(cps || []);
                if (cps && cps.length > 0) setSelectedProvider(cps[0].name);
            } catch (err) {
                console.log('Failed to load courier providers', err);
            }
        })();
    }, []);

    const handleUpdateStatus = async () => {
        if (!order || !newStatus) return;
        setUpdatingStatus(true);
        try {
            await axios.put(`/api/orders/${order._id}/status`, { status: newStatus });
            setOrder({ ...order, status: newStatus });
            alert('Order status updated successfully');
        } catch (err) {
            console.log('Failed to update order', err);
            alert('Failed to update order status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handlePrintInvoice = () => {
        window.print();
    };

    const toggleShipmentDetails = (shipmentId) => {
        const newExpanded = new Set(expandedShipments);
        if (newExpanded.has(shipmentId)) {
            newExpanded.delete(shipmentId);
        } else {
            newExpanded.add(shipmentId);
        }
        setExpandedShipments(newExpanded);
    };

    // Load available products for adding items
    const loadAvailableProducts = async () => {
        try {
            const res = await axios.get('/api/products');
            setAvailableProducts(res.data.products || []);
        } catch (err) {
            console.log('Failed to load products', err);
        }
    };

    // Load variations for selected product
    const loadProductVariations = async (productId) => {
        try {
            const res = await axios.get(`/api/product-variations?product=${productId}`);
            return res.data || [];
        } catch (err) {
            console.log('Failed to load variations', err);
            return [];
        }
    };

    // Handle quantity update
    const handleUpdateQuantity = async (itemIndex) => {
        if (!newQty || newQty <= 0) return alert('Please enter a valid quantity');
        try {
            await axios.put(`/api/orders/${order._id}/items`, { itemIndex, newQty: parseInt(newQty) });
            setOrder({ ...order, totalPrice: order.items.reduce((sum, item, idx) => idx === itemIndex ? sum + (item.price * parseInt(newQty)) : sum + (item.price * item.qty), 0) });
            setEditingItem(null);
            setNewQty('');
            alert('Quantity updated successfully');
            loadOrder(); // Reload to get updated data
        } catch (err) {
            console.log('Failed to update quantity', err);
            alert('Failed to update quantity: ' + (err.response?.data?.message || err.message));
        }
    };

    // Handle item removal
    const handleRemoveItem = async (itemIndex) => {
        if (!confirm('Are you sure you want to remove this item?')) return;
        try {
            await axios.delete(`/api/orders/${order._id}/items`, { data: { itemIndex } });
            alert('Item removed successfully');
            loadOrder(); // Reload to get updated data
        } catch (err) {
            console.log('Failed to remove item', err);
            alert('Failed to remove item: ' + (err.response?.data?.message || err.message));
        }
    };

    // Handle add item
    const handleAddItem = async () => {
        if (!selectedProduct) return alert('Please select a product');
        if (!addQty || addQty <= 0) return alert('Please enter a valid quantity');

        try {
            const product = availableProducts.find(p => p._id === selectedProduct);
            if (!product) return alert('Product not found');

            await axios.post(`/api/orders/${order._id}/items`, {
                productId: selectedProduct,
                variationId: selectedVariation || undefined,
                qty: parseInt(addQty),
                price: product.discountedPrice || product.price
            });

            alert('Item added successfully');
            setShowAddItem(false);
            setSelectedProduct('');
            setSelectedVariation('');
            setAddQty(1);
            loadOrder(); // Reload to get updated data
        } catch (err) {
            console.log('Failed to add item', err);
            alert('Failed to add item: ' + (err.response?.data?.message || err.message));
        }
    };

    // Handle address update
    const handleUpdateAddress = async () => {
        try {
            await axios.put(`/api/orders/${order._id}/address`, { shippingInfo: addressForm });
            setOrder({ ...order, shippingInfo: addressForm });
            setEditingAddress(false);
            alert('Address updated successfully');
        } catch (err) {
            console.log('Failed to update address', err);
            alert('Failed to update address: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) {
        return <div className="container py-4"><p>Loading...</p></div>;
    }

    if (!order) {
        return (
            <div className="container py-4">
                <p>Order not found</p>
                <button className="btn btn-secondary" onClick={() => navigate('/admin?section=orders')}>Back to Orders</button>
            </div>
        );
    }

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>Order Detils</h3>
                <div className="d-flex gap-2">
                    <button className="btn btn-secondary" onClick={() => navigate('/admin?section=orders')}>
                        ← Back to Orders
                    </button>
                    <button className="btn btn-outline-secondary" onClick={handlePrintInvoice}>
                        🖨️ Print Invoice
                    </button>
                </div>
            </div>
            <div className="row">
                <div className="col-md-12">

                    <div className="card">
                        <div className="card-body">
                            {/* Header with Order ID and Status Update */}
                            <div className="row mb-4 pb-3 border-bottom">
                                <div className="col-md-4">
                                    <h3 className="mb-0">Order #{order._id.slice(0, 12)}</h3>
                                    <small className="text-muted">{formatDate(order.createdAt)}</small>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label mb-2"><strong>Update Status:</strong></label>
                                    <div className="input-group">
                                        <select
                                            className="form-select"
                                            value={newStatus}
                                            onChange={(e) => setNewStatus(e.target.value)}
                                            style={{ maxWidth: '150px' }}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Processing">Processing</option>
                                            <option value="Shipped">Shipped</option>
                                            <option value="Delivered">Delivered</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleUpdateStatus}
                                            disabled={updatingStatus || newStatus === order.status}
                                        >
                                            {updatingStatus ? 'Updating...' : 'Update'}
                                        </button>
                                    </div>
                                </div>
                                <div className="col-md-4 text-end">
                                    <div className="mb-2">
                                        <span className={`badge ${order.status === 'Completed' ? 'bg-success' : order.status === 'Cancelled' ? 'bg-danger' : order.status === 'Delivered' ? 'bg-info' : 'bg-warning'}`} style={{ fontSize: '1rem', padding: '8px 12px' }}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Order Info */}
                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <h6 className="mb-3">Order Information</h6>
                                    <p><strong>User:</strong> {order.user ? (order.user.name || order.user.email) : 'Guest'}</p>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5>Order Items</h5>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => {
                                            setShowAddItem(true);
                                            loadAvailableProducts();
                                        }}
                                    >
                                        + Add Item
                                    </button>
                                </div>
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Quantity</th>
                                                <th>Price</th>
                                                <th>Stock</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.items && order.items.map((item, idx) => {
                                                const productId = typeof item.product === 'string' ? item.product : item.product?._id;
                                                const product = products[productId];
                                                return (
                                                    <tr key={idx}>
                                                        <td>{item.name || 'Unknown Product'}</td>
                                                        <td>
                                                            {editingItem === idx ? (
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm"
                                                                        style={{ width: '80px' }}
                                                                        value={newQty}
                                                                        onChange={(e) => setNewQty(e.target.value)}
                                                                        min="1"
                                                                    />
                                                                    <button
                                                                        className="btn btn-success btn-sm"
                                                                        onClick={() => handleUpdateQuantity(idx)}
                                                                    >
                                                                        ✓
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-secondary btn-sm"
                                                                        onClick={() => {
                                                                            setEditingItem(null);
                                                                            setNewQty('');
                                                                        }}
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span>{item.qty}</span>
                                                            )}
                                                        </td>
                                                        <td>{formatPrice(item.price)}</td>
                                                        <td>
                                                            {product ? (
                                                                <span className={product.stock && product.stock > 0 ? 'badge bg-success' : 'badge bg-danger'}>
                                                                    {product.stock || 0}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted">—</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className="btn-group btn-group-sm">
                                                                <button
                                                                    className="btn btn-outline-primary"
                                                                    onClick={() => {
                                                                        setEditingItem(idx);
                                                                        setNewQty(item.qty);
                                                                    }}
                                                                    title="Edit Quantity"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-danger"
                                                                    onClick={() => handleRemoveItem(idx)}
                                                                    title="Remove Item"
                                                                >
                                                                    🗑️
                                                                </button>
                                                                {productId && (
                                                                    <Link to={`/admin/products/edit/${productId}`} className="btn btn-outline-info" title="View Product">
                                                                        👁️
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Add Item Form */}
                                {showAddItem && (
                                    <div className="mt-3 p-3 border rounded bg-light">
                                        <h6>Add New Item</h6>
                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label className="form-label">Product</label>
                                                <select
                                                    className="form-select"
                                                    value={selectedProduct}
                                                    onChange={async (e) => {
                                                        setSelectedProduct(e.target.value);
                                                        setSelectedVariation('');
                                                        if (e.target.value) {
                                                            const variations = await loadProductVariations(e.target.value);
                                                            setProductVariations(variations);
                                                        } else {
                                                            setProductVariations([]);
                                                        }
                                                    }}
                                                >
                                                    <option value="">Select Product</option>
                                                    {availableProducts.map(p => (
                                                        <option key={p._id} value={p._id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">Quantity</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={addQty}
                                                    onChange={(e) => setAddQty(e.target.value)}
                                                    min="1"
                                                />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">Variation (Optional)</label>
                                                <select
                                                    className="form-select"
                                                    value={selectedVariation}
                                                    onChange={(e) => setSelectedVariation(e.target.value)}
                                                    disabled={!selectedProduct}
                                                >
                                                    <option value="">No variation</option>
                                                    {productVariations.map(v => (
                                                        <option key={v._id} value={v._id}>{v.size}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-2 d-flex align-items-end">
                                                <button
                                                    className="btn btn-success me-2"
                                                    onClick={handleAddItem}
                                                >
                                                    Add
                                                </button>
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => {
                                                        setShowAddItem(false);
                                                        setSelectedProduct('');
                                                        setSelectedVariation('');
                                                        setProductVariations([]);
                                                        setAddQty(1);
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Order Summary */}
                            <div className="mb-4">
                                <h5>Order Summary</h5>
                                <div className="row">
                                    <div className="col-md-6">
                                        <p><strong>Total Price:</strong> <span style={{ fontSize: '1.2rem', color: '#28a745' }}>{formatPrice(order.totalPrice)}</span></p>
                                        <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Response */}
                            {order.paymentResponse && (
                                <div className="mb-4">
                                    <h5>Payment Response</h5>
                                    <div className="mb-3">
                                        <button
                                            className="btn btn-sm btn-outline-info"
                                            onClick={() => setShowPaymentResponse(!showPaymentResponse)}
                                        >
                                            {showPaymentResponse ? 'Hide' : 'Show'} SSL Commerz Payment Details
                                        </button>
                                    </div>
                                    {showPaymentResponse && (
                                        <div className="p-3 bg-light rounded">
                                            <h6>SSL Commerz Payment Details:</h6>
                                            <pre className="mb-0" style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', maxHeight: '400px', overflow: 'auto' }}>
                                                {JSON.stringify(order.paymentResponse, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Shipping Address */}
                            {order.shippingInfo && (
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5>Shipping Address</h5>
                                        <button
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() => {
                                                setEditingAddress(true);
                                                setAddressForm({ ...order.shippingInfo });
                                            }}
                                        >
                                            ✏️ Edit Address
                                        </button>
                                    </div>

                                    {editingAddress ? (
                                        <div className="p-3 border rounded bg-light">
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label">Name *</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={addressForm.name || ''}
                                                        onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label">Phone *</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={addressForm.phone || ''}
                                                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label">Address *</label>
                                                    <textarea
                                                        className="form-control"
                                                        rows="2"
                                                        value={addressForm.address || ''}
                                                        onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">City</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={addressForm.city || ''}
                                                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">Postal Code</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={addressForm.postalCode || ''}
                                                        onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">Country</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={addressForm.country || ''}
                                                        onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label">Email</label>
                                                    <input
                                                        type="email"
                                                        className="form-control"
                                                        value={addressForm.email || ''}
                                                        onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-12">
                                                    <button
                                                        className="btn btn-success me-2"
                                                        onClick={handleUpdateAddress}
                                                    >
                                                        Update Address
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => setEditingAddress(false)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p>
                                            <strong>{order.shippingInfo.name}</strong><br />
                                            {order.shippingInfo.address}<br />
                                            {order.shippingInfo.city}, {order.shippingInfo.postalCode}<br />
                                            {order.shippingInfo.country}<br />
                                            Phone: {order.shippingInfo.phone}<br />
                                            Email: {order.shippingInfo.email}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Shipments */}
                            <div className="mb-4">
                                <h5>Shipments</h5>
                                <div className="mb-3">
                                    {providers.length > 0 ? (
                                        <div className="input-group" style={{ maxWidth: 420 }}>
                                            <select className="form-select" value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)}>
                                                {providers.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                            </select>
                                            <button className="btn btn-primary" onClick={async () => {
                                                if (!selectedProvider) return alert('Select a provider');
                                                try {
                                                    const res = await axios.post('/api/couriers/create', { provider: selectedProvider, orderId: order._id });
                                                    alert('Shipment created');
                                                    // reload shipments
                                                    const sres = await axios.get(`/api/couriers?orderId=${order._id}`);
                                                    setShipments(sres.data && sres.data.shipments ? sres.data.shipments : []);
                                                } catch (err) {
                                                    console.log('Failed to create shipment', err);
                                                    alert('Failed to create shipment');
                                                }
                                            }}>Create Shipment</button>
                                        </div>
                                    ) : (
                                        <p className="text-muted">No courier providers enabled. Configure them in Settings.</p>
                                    )}
                                </div>

                                {shipments.length === 0 ? (
                                    <p className="text-muted">No shipments for this order yet.</p>
                                ) : (
                                    <div className="list-group">
                                        {shipments.map(s => (
                                            <div key={s._id} className="list-group-item">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <strong>{s.provider}</strong> — <small className="text-muted">{s.status}</small>
                                                        <div>
                                                            {s.trackingUrl ? <a href={s.trackingUrl} target="_blank" rel="noreferrer">Tracking Link</a> : <span className="text-muted">No tracking URL</span>}
                                                            {' '}
                                                            {s.labelUrl ? <a href={s.labelUrl} target="_blank" rel="noreferrer">Label</a> : null}
                                                        </div>
                                                        {s.metadata && (
                                                            <div className="mt-2">
                                                                <button
                                                                    className="btn btn-sm btn-outline-info"
                                                                    onClick={() => toggleShipmentDetails(s._id)}
                                                                >
                                                                    {expandedShipments.has(s._id) ? 'Hide' : 'Show'} API Response
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-end">
                                                        <small className="text-muted">Created {new Date(s.createdAt).toLocaleString()}</small>
                                                    </div>
                                                </div>
                                                {expandedShipments.has(s._id) && s.metadata && (
                                                    <div className="mt-3 p-3 bg-light rounded">
                                                        <h6>Shipment API Response:</h6>
                                                        <pre className="mb-0" style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                                                            {JSON.stringify(s.metadata, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
