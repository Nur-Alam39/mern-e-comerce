import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from '../utils/api';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

export default function UserOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { formatPrice } = useSettings();
    const { user } = useAuth();
    const [order, setOrder] = useState(null);
    const [products, setProducts] = useState({});
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadOrder();
        // Check for payment status in URL
        const urlParams = new URLSearchParams(location.search);
        const payment = urlParams.get('payment');
        if (payment === 'success') {
            setToast('Payment successful! Your order is being processed.');
        } else if (payment === 'failed') {
            setToast('Payment failed. Please try again or contact support.');
        } else if (payment === 'cancelled') {
            setToast('Payment was cancelled.');
        }
    }, [id, location.search]);

    const loadOrder = async () => {
        try {
            let orderData = null;
            if (location.pathname.startsWith('/order/')) {
                // Guest order, fetch by ID
                const res = await axios.get(`/api/orders/${id}`);
                orderData = res.data;
            } else {
                // Logged-in user, fetch specific order by ID
                const res = await axios.get(`/api/orders/${id}`);
                orderData = res.data;
            }
            if (orderData) {
                setOrder(orderData);
                // Load product details for each item
                if (orderData.items) {
                    const prods = {};
                    for (const item of orderData.items) {
                        const productId = typeof item.product === 'string' ? item.product : item.product?._id;
                        if (productId) {
                            try {
                                const pRes = await axios.get(`/api/products/${productId}`);
                                prods[productId] = pRes.data;
                            } catch (err) {
                                console.log('Failed to load product', err);
                                prods[productId] = { stock: 'N/A', name: item.name };
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

    if (loading) {
        return <div className="container py-4"><p>Loading...</p></div>;
    }

    if (!order) {
        return (
            <div className="container py-4">
                <p>Order not found</p>
                <Link to={location.pathname.startsWith('/order/') ? "/" : "/profile?tab=orders"} className="btn btn-secondary">Back to {location.pathname.startsWith('/order/') ? "Home" : "Orders"}</Link>
            </div>
        );
    }

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="container py-4">
            <Link to={location.pathname.startsWith('/order/') ? "/" : "/profile?tab=orders"} className="btn btn-secondary mb-3">← Back to {location.pathname.startsWith('/order/') ? "Home" : "Orders"}</Link>

            <div className="card">
                <div className="card-body">
                    {/* Header */}
                    <div className="row mb-4 pb-3 border-bottom">
                        <div className="col-md-6">
                            <h3 className="mb-0">Order #{order._id.slice(0, 12)}</h3>
                            <small className="text-muted">{formatDate(order.createdAt)}</small>
                        </div>
                        <div className="col-md-6 text-end">
                            <span className={`badge ${order.status === 'Delivered' ? 'bg-success' : order.status === 'Cancelled' ? 'bg-danger' : order.status === 'Shipped' ? 'bg-info' : 'bg-warning'}`} style={{ fontSize: '1rem', padding: '8px 12px' }}>
                                {order.status}
                            </span>
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
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items && order.items.map((item, idx) => {
                                        const productId = typeof item.product === 'string' ? item.product : item.product?._id;
                                        const product = products[productId];
                                        return (
                                            <tr key={idx}>
                                                <td>
                                                    <Link to={`/products/${productId}`}>{item.name || 'Unknown Product'}</Link>
                                                </td>
                                                <td>{item.qty}</td>
                                                <td>{formatPrice(item.price)}</td>
                                                <td>{formatPrice(item.price * item.qty)}</td>
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
                                <p><strong>Total Price:</strong> <span style={{ fontSize: '1.2rem', color: '#28a745' }}>{formatPrice(order.totalPrice)}</span></p>
                                <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                            </div>
                        </div>
                    </div>

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
                </div>
            </div>
            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </div>
    );
}