import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/api';

export default function AdminCustomerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    // const [currentPage, setCurrentPage] = useState(1);
    // const [pageSize] = useState(10); // Orders per page

    // // Pagination calculations
    // const totalPages = Math.ceil(orders.length / pageSize);
    // const paginatedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    useEffect(() => {
        loadCustomer();
    }, [id]);


    const loadCustomer = async () => {
        try {
            // Load user details
            const userRes = await axios.get('/api/users/admin/users');
            const users = Array.isArray(userRes.data) ? userRes.data : [];
            const foundUser = users.find(u => u._id === id);
            if (foundUser) {
                setUser(foundUser);
                // Load orders for this user
                const orderRes = await axios.get('/api/orders');
                const allOrders = Array.isArray(orderRes.data) ? orderRes.data : [];
                const userOrders = allOrders.filter(o => o.user && o.user._id === foundUser._id);
                setOrders(userOrders);
            }
        } catch (err) {
            console.log('Failed to load customer', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            'Pending': 'bg-warning',
            'Processing': 'bg-info',
            'Shipped': 'bg-primary',
            'Delivered': 'bg-success',
            'Cancelled': 'bg-danger'
        };
        return statusClasses[status] || 'bg-secondary';
    };

    if (loading) {
        return <div className="container py-4"><p>Loading...</p></div>;
    }

    if (!user) {
        return (
            <div className="container py-4">
                <p>Customer not found</p>
                <button className="btn btn-secondary" onClick={() => navigate('/admin?section=customers')}>Back to Customers</button>
            </div>
        );
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>Customer Details</h3>
                <button className="btn btn-secondary" onClick={() => navigate('/admin?section=customers')}>
                    ← Back to Customers
                </button>
            </div>

            <div className="row">
                <div className="col-md-12">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5>Customer Information</h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <p><strong>Name:</strong> {user.name}</p>
                                    <p><strong>Email:</strong> {user.email}</p>
                                    <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
                                </div>
                                <div className="col-md-6">
                                    <p><strong>Joined:</strong> {formatDate(user.createdAt)}</p>
                                    <p><strong>Status:</strong>
                                        <span className={`badge ms-2 ${user.blocked ? 'bg-danger' : 'bg-success'}`}>
                                            {user.blocked ? 'Blocked' : 'Active'}
                                        </span>
                                    </p>
                                    <p><strong>Total Orders:</strong> {orders.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h5>Order History</h5>
                        </div>
                        <div className="card-body">
                            {orders.length === 0 ? (
                                <p className="text-muted">No orders found for this customer.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                                <th>Total</th>
                                                <th>Items</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map(order => (
                                                <tr key={order._id}>
                                                    <td>#{order._id.slice(0, 12)}</td>
                                                    <td>{formatDate(order.createdAt)}</td>
                                                    <td>
                                                        <span className={`badge ${getStatusBadge(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td>${order.totalPrice}</td>
                                                    <td>{order.items ? order.items.length : 0} item(s)</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setShowModal(true);
                                                            }}
                                                        >
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Details Modal */}
            {showModal && selectedOrder && (
                <div className="modal-backdrop show"></div>
            )}
            {showModal && selectedOrder && (
                <div className="modal show d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Order Details - {selectedOrder._id.slice(0, 12)}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <p><strong>Order Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                                        <p><strong>Status:</strong> <span className={`badge ${getStatusBadge(selectedOrder.status)}`}>{selectedOrder.status}</span></p>
                                    </div>
                                    <div className="col-md-6">
                                        <p><strong>Total Price:</strong> ${selectedOrder.totalPrice}</p>
                                        <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</p>
                                    </div>
                                </div>

                                <h6>Order Items</h6>
                                <div className="table-responsive mb-3">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Quantity</th>
                                                <th>Price</th>
                                                <th>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>{item.name || 'Unknown Product'}</td>
                                                    <td>{item.qty}</td>
                                                    <td>${item.price}</td>
                                                    <td>${(item.qty * item.price).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {selectedOrder.shippingInfo && (
                                    <div>
                                        <h6>Shipping Address</h6>
                                        <p>
                                            <strong>{selectedOrder.shippingInfo.name}</strong><br />
                                            {selectedOrder.shippingInfo.address}<br />
                                            {selectedOrder.shippingInfo.city}, {selectedOrder.shippingInfo.postalCode}<br />
                                            {selectedOrder.shippingInfo.country}<br />
                                            Phone: {selectedOrder.shippingInfo.phone}<br />
                                            Email: {selectedOrder.shippingInfo.email}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
