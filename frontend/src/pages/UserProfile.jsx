import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from '../utils/api';
import { useSettings } from '../hooks/useSettings';

export default function UserProfile() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { formatPrice } = useSettings();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ordersPage, setOrdersPage] = useState(1);
    const [ordersTotalPages, setOrdersTotalPages] = useState(1);
    const [ordersTotal, setOrdersTotal] = useState(0);
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
    const [addressForm, setAddressForm] = useState({
        type: 'shipping',
        name: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
    });
    const [editingAddress, setEditingAddress] = useState(null);
    const [showAddressForm, setShowAddressForm] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadData();
        const tab = searchParams.get('tab');
        if (tab) {
            setActiveTab(tab);
        }
    }, [user, navigate, searchParams, ordersPage]);

    const handleOrdersPageChange = (page) => {
        setOrdersPage(page);
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [profileRes, ordersRes] = await Promise.all([
                axios.get('/api/users/profile'),
                axios.get(`/api/users/orders?page=${ordersPage}&limit=10`),
            ]);
            setProfile(profileRes.data);
            const ordersData = ordersRes.data;
            setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
            setOrdersPage(ordersData.page || 1);
            setOrdersTotalPages(ordersData.pages || 1);
            setOrdersTotal(ordersData.total || 0);
            setProfileForm({
                name: profileRes.data.name || '',
                email: profileRes.data.email || '',
                phone: profileRes.data.phone || '',
            });
        } catch (err) {
            console.log('Failed to load data', err);
            alert('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put('/api/users/profile', {
                name: profileForm.name,
                phone: profileForm.phone,
            });
            setProfile(res.data);
            setEditingProfile(false);
            alert('Profile updated successfully');
        } catch (err) {
            console.log('Failed to update profile', err);
            alert('Failed to update profile');
        }
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        try {
            const endpoint =
                addressForm.type === 'shipping'
                    ? '/api/users/shipping-address'
                    : '/api/users/billing-address';

            const res = await axios.post(endpoint, {
                name: addressForm.name,
                phone: addressForm.phone,
                address: addressForm.address,
                city: addressForm.city,
                postalCode: addressForm.postalCode,
                country: addressForm.country,
            });
            setProfile(res.data);
            setShowAddressForm(false);
            setAddressForm({
                type: 'shipping',
                name: '',
                phone: '',
                address: '',
                city: '',
                postalCode: '',
                country: '',
            });
            alert('Address saved successfully');
        } catch (err) {
            console.log('Failed to save address', err);
            alert('Failed to save address');
        }
    };

    if (loading) return <div className="container mt-4"><p>Loading...</p></div>;
    if (!profile) return <div className="container mt-4"><p>Profile not found</p></div>;

    return (
        <div className="container mt-4 mb-5">
            <div className="row">
                <div className="col-md-3 mb-3">
                    <div className="card">
                        <div className="card-body text-center">
                            <div className="mb-3">
                                <i className="fa-solid fa-user-circle" style={{ fontSize: '3rem' }}></i>
                            </div>
                            <h5>{profile.name}</h5>
                            <p className="text-muted">{profile.email}</p>
                            {profile.phone && <p className="text-muted">{profile.phone}</p>}
                            <hr />
                            <div className="list-group list-group-flush">
                                <button
                                    className={`list-group-item list-group-item-action text-start ${activeTab === 'profile' ? 'active' : ''
                                        }`}
                                    onClick={() => setActiveTab('profile')}
                                >
                                    <i className="fa-solid fa-user me-2"></i>Profile
                                </button>
                                <button
                                    className={`list-group-item list-group-item-action text-start ${activeTab === 'addresses' ? 'active' : ''
                                        }`}
                                    onClick={() => setActiveTab('addresses')}
                                >
                                    <i className="fa-solid fa-map-pin me-2"></i>Addresses
                                </button>
                                <button
                                    className={`list-group-item list-group-item-action text-start ${activeTab === 'orders' ? 'active' : ''
                                        }`}
                                    onClick={() => setActiveTab('orders')}
                                >
                                    <i className="fa-solid fa-box me-2"></i>Orders ({ordersTotal})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-9">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="card">
                            <div className="card-header bg-white">
                                <h5>Profile Information</h5>
                            </div>
                            <div className="card-body">
                                {!editingProfile ? (
                                    <>
                                        <div className="mb-3">
                                            <label className="form-label fw-bold">Name</label>
                                            <p>{profile.name}</p>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-bold">Email</label>
                                            <p>{profile.email}</p>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-bold">Phone</label>
                                            <p>{profile.phone || '-'}</p>
                                        </div>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => setEditingProfile(true)}
                                        >
                                            Edit Profile
                                        </button>
                                    </>
                                ) : (
                                    <form onSubmit={handleSaveProfile}>
                                        <div className="mb-3">
                                            <label className="form-label">Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={profileForm.name}
                                                onChange={(e) =>
                                                    setProfileForm({
                                                        ...profileForm,
                                                        name: e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Email</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={profileForm.email}
                                                disabled
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Phone</label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                value={profileForm.phone}
                                                onChange={(e) =>
                                                    setProfileForm({
                                                        ...profileForm,
                                                        phone: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <button type="submit" className="btn btn-success me-2">
                                            Save Changes
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => setEditingProfile(false)}
                                        >
                                            Cancel
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Addresses Tab */}
                    {activeTab === 'addresses' && (
                        <>
                            {!showAddressForm ? (
                                <div>
                                    {/* Shipping Address */}
                                    <div className="card mb-3">
                                        <div className="card-header d-flex justify-content-between align-items-center">
                                            <h5 className="mb-0">Shipping Address</h5>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => {
                                                    setAddressForm({
                                                        type: 'shipping',
                                                        name: profile.shippingAddress?.name || '',
                                                        phone: profile.shippingAddress?.phone || '',
                                                        address: profile.shippingAddress?.address || '',
                                                        city: profile.shippingAddress?.city || '',
                                                        postalCode: profile.shippingAddress?.postalCode || '',
                                                        country: profile.shippingAddress?.country || '',
                                                    });
                                                    setShowAddressForm(true);
                                                }}
                                            >
                                                {profile.shippingAddress ? 'Edit' : 'Add'}
                                            </button>
                                        </div>
                                        <div className="card-body">
                                            {profile.shippingAddress ? (
                                                <>
                                                    <p className="mb-1">
                                                        <strong>{profile.shippingAddress.name}</strong>
                                                    </p>
                                                    <p className="mb-1">{profile.shippingAddress.phone}</p>
                                                    <p className="mb-1">{profile.shippingAddress.address}</p>
                                                    <p>
                                                        {profile.shippingAddress.city},{' '}
                                                        {profile.shippingAddress.postalCode}{' '}
                                                        {profile.shippingAddress.country}
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-muted">No shipping address saved</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Billing Address */}
                                    <div className="card">
                                        <div className="card-header d-flex justify-content-between align-items-center">
                                            <h5 className="mb-0">Billing Address</h5>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => {
                                                    setAddressForm({
                                                        type: 'billing',
                                                        name: profile.billingAddress?.name || '',
                                                        phone: profile.billingAddress?.phone || '',
                                                        address: profile.billingAddress?.address || '',
                                                        city: profile.billingAddress?.city || '',
                                                        postalCode: profile.billingAddress?.postalCode || '',
                                                        country: profile.billingAddress?.country || '',
                                                    });
                                                    setShowAddressForm(true);
                                                }}
                                            >
                                                {profile.billingAddress ? 'Edit' : 'Add'}
                                            </button>
                                        </div>
                                        <div className="card-body">
                                            {profile.billingAddress ? (
                                                <>
                                                    <p className="mb-1">
                                                        <strong>{profile.billingAddress.name}</strong>
                                                    </p>
                                                    <p className="mb-1">{profile.billingAddress.phone}</p>
                                                    <p className="mb-1">{profile.billingAddress.address}</p>
                                                    <p>
                                                        {profile.billingAddress.city},{' '}
                                                        {profile.billingAddress.postalCode}{' '}
                                                        {profile.billingAddress.country}
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-muted">No billing address saved</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="card">
                                    <div className="card-header">
                                        <h5>
                                            {addressForm.type === 'shipping'
                                                ? 'Edit Shipping Address'
                                                : 'Edit Billing Address'}
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <form onSubmit={handleSaveAddress}>
                                            <div className="mb-3">
                                                <label className="form-label">Full Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={addressForm.name}
                                                    onChange={(e) =>
                                                        setAddressForm({ ...addressForm, name: e.target.value })
                                                    }
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Phone</label>
                                                <input
                                                    type="tel"
                                                    className="form-control"
                                                    value={addressForm.phone}
                                                    onChange={(e) =>
                                                        setAddressForm({ ...addressForm, phone: e.target.value })
                                                    }
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Address</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={addressForm.address}
                                                    onChange={(e) =>
                                                        setAddressForm({
                                                            ...addressForm,
                                                            address: e.target.value,
                                                        })
                                                    }
                                                    required
                                                />
                                            </div>
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">City</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={addressForm.city}
                                                        onChange={(e) =>
                                                            setAddressForm({
                                                                ...addressForm,
                                                                city: e.target.value,
                                                            })
                                                        }
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Postal Code</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={addressForm.postalCode}
                                                        onChange={(e) =>
                                                            setAddressForm({
                                                                ...addressForm,
                                                                postalCode: e.target.value,
                                                            })
                                                        }
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Country</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={addressForm.country}
                                                    onChange={(e) =>
                                                        setAddressForm({
                                                            ...addressForm,
                                                            country: e.target.value,
                                                        })
                                                    }
                                                    required
                                                />
                                            </div>
                                            <button type="submit" className="btn btn-success me-2">
                                                Save Address
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => setShowAddressForm(false)}
                                            >
                                                Cancel
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                        <div>
                            {ordersTotal === 0 ? (
                                <div className="alert alert-info">No orders yet</div>
                            ) : (
                                <>
                                    <div className="table-responsive">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Order ID</th>
                                                    <th>Date</th>
                                                    <th>Items</th>
                                                    <th>Total</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orders.map((order) => (
                                                    <tr key={order._id}>
                                                            <td>
                                                                <Link to={`/profile/orders/${order._id}`} style={{ textDecoration: 'none' }}>
                                                                    <small>{order._id.substring(0, 8)}...</small>
                                                                </Link>
                                                            </td>
                                                            <td>
                                                                {new Date(order.createdAt).toLocaleDateString()}
                                                            </td>
                                                            <td>{order.items.length} item(s)</td>
                                                            <td>{formatPrice(order.totalPrice)}</td>
                                                            <td>
                                                                <span
                                                                    className={`badge ${order.status === 'Delivered'
                                                                            ? 'bg-success'
                                                                            : order.status === 'Cancelled'
                                                                                ? 'bg-danger'
                                                                                : order.status === 'Shipped'
                                                                                    ? 'bg-info'
                                                                                    : 'bg-warning'
                                                                        }`}
                                                                >
                                                                    {order.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {ordersTotalPages > 1 && (
                                        <nav aria-label="Orders pagination">
                                            <ul className="pagination justify-content-center">
                                                <li className={`page-item ${ordersPage === 1 ? 'disabled' : ''}`}>
                                                    <button className="page-link" onClick={() => handleOrdersPageChange(ordersPage - 1)}>Previous</button>
                                                </li>
                                                {Array.from({ length: ordersTotalPages }, (_, i) => i + 1).map(page => (
                                                    <li key={page} className={`page-item ${page === ordersPage ? 'active' : ''}`}>
                                                        <button className="page-link" onClick={() => handleOrdersPageChange(page)}>{page}</button>
                                                    </li>
                                                ))}
                                                <li className={`page-item ${ordersPage === ordersTotalPages ? 'disabled' : ''}`}>
                                                    <button className="page-link" onClick={() => handleOrdersPageChange(ordersPage + 1)}>Next</button>
                                                </li>
                                            </ul>
                                            <p className="text-center text-muted mt-2">Page {ordersPage} of {ordersTotalPages} ({ordersTotal} total orders)</p>
                                        </nav>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
