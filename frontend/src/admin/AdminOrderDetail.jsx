import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from '../utils/api';

export default function AdminOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
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
                                <h5>Order Items</h5>
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Quantity</th>
                                                <th>Price</th>
                                                <th>Stock</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.items && order.items.map((item, idx) => {
                                                const productId = typeof item.product === 'string' ? item.product : item.product?._id;
                                                const product = products[productId];
                                                return (
                                                    <tr key={idx}>
                                                        <td>{item.name || 'Unknown Product'}</td>
                                                        <td>{item.qty}</td>
                                                        <td>${item.price}</td>
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
                                                            {productId && (
                                                                <Link to={`admin/products/edit/${productId}`} className="btn btn-sm btn-primary">View</Link>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="mb-4">
                                <h5>Order Summary</h5>
                                <div className="row">
                                    <div className="col-md-6">
                                        <p><strong>Total Price:</strong> <span style={{ fontSize: '1.2rem', color: '#28a745' }}>${order.totalPrice}</span></p>
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
                                    <h5>Shipping Address</h5>
                                    <p>
                                        <strong>{order.shippingInfo.name}</strong><br />
                                        {order.shippingInfo.address}<br />
                                        {order.shippingInfo.city}, {order.shippingInfo.postalCode}<br />
                                        {order.shippingInfo.country}<br />
                                        Phone: {order.shippingInfo.phone}<br />
                                        Email: {order.shippingInfo.email}
                                    </p>
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
