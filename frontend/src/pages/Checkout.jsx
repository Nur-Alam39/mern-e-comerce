import React, { useState, useEffect } from 'react';
import axios from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';

const PAYMENT_METHOD_LABELS = {
  'bkash': 'bKash',
  'nagad': 'Nagad',
  'ssl_commerce': 'SSL Commerce',
  'stripe': 'Stripe',
  'paypal': 'PayPal'
};

const CURRENCY_SYMBOLS = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'BDT': '৳',
  'INR': '₹'
};

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', address: '', email: '', city: '', postalCode: '', country: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [userAddresses, setUserAddresses] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/settings');
        setSettings(res.data);
        // Auto-select first enabled payment method or cash on delivery
        const enabledMethods = res.data.paymentMethods.filter(m => m.enabled);
        if (enabledMethods.length === 0) {
          setPaymentMethod('cash_on_delivery');
        } else {
          setPaymentMethod(enabledMethods[0].name);
        }
      } catch (err) {
        console.log('Failed to load settings', err);
        setPaymentMethod('cash_on_delivery');
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Load user's saved addresses if logged in
  useEffect(() => {
    if (user) {
      (async () => {
        try {
          const res = await axios.get('/api/users/profile');
          setUserAddresses(res.data);
          // Pre-fill with saved shipping address if available
          if (res.data.shippingAddress) {
            setForm({
              name: res.data.shippingAddress.name || '',
              phone: res.data.shippingAddress.phone || '',
              address: res.data.shippingAddress.address || '',
              email: res.data.email || '',
              city: res.data.shippingAddress.city || '',
              postalCode: res.data.shippingAddress.postalCode || '',
              country: res.data.shippingAddress.country || '',
            });
          } else {
            setForm(prev => ({
              ...prev,
              email: res.data.email || '',
              name: res.data.name || '',
              phone: res.data.phone || '',
            }));
          }
        } catch (err) {
          console.log('Failed to load user addresses', err);
        }
      })();
    }
  }, [user]);

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const currency = settings?.currency || 'USD';
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';

  const handleUseAddress = (address) => {
    setSelectedAddress(address._id);
    setForm({
      name: address.name,
      phone: address.phone,
      address: address.address,
      email: form.email,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    // Validate cart items
    for (const item of cart) {
      if (!item.product) {
        alert('Invalid item in cart: missing product ID');
        return;
      }
      if (!item.qty || item.qty < 1) {
        alert('Invalid item in cart: invalid quantity');
        return;
      }
      if (!item.price || item.price < 0) {
        alert('Invalid item in cart: invalid price');
        return;
      }
    }

    const items = cart.map(i => ({ product: i.product, qty: i.qty, price: i.price, variationId: i.variationId }));
    setLoading(true);
    try {
      const payload = {
        items,
        shippingInfo: { name: form.name, phone: form.phone, address: form.address, email: form.email, city: form.city, postalCode: form.postalCode, country: form.country },
        totalPrice: totalAmount,
        paymentMethod: paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : paymentMethod
      };
      console.log('Order payload:', payload);
      const res = await axios.post('/api/orders', payload);
      if (res.data.gatewayUrl) {
        // Redirect to SSL Commerz gateway
        window.location.href = res.data.gatewayUrl;
      } else {
        clearCart();
        setToast('Order placed successfully!');
        setTimeout(() => navigate(user ? '/profile?tab=orders' : `/order/${res.data._id}`), 100);
      }
    } catch (err) {
      console.log('Order failed', err.response?.data || err.message);
      alert('Order failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && !loading) {
    return (
      <div className="container py-4">
        <h2>Checkout</h2>
        <div className="alert alert-warning">Your cart is empty. <a href="/products">Continue shopping</a></div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2>Checkout</h2>
      <div className="mb-4">
        <button className="btn btn-outline-secondary me-2" onClick={() => navigate('/cart')}>Back to Cart</button>
        <button className="btn btn-outline-primary" onClick={() => navigate('/products')}>Continue Shopping</button>
      </div>
      <div className="row">
        {/* Shipping Form */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-white border-bottom-0">
              <h5>Shipping Information</h5>
            </div>
            <div className="card-body">
              {/* Saved Addresses for logged-in users */}
              {userAddresses && userAddresses.shippingAddress && (
                <div className="mb-4 p-3 bg-light border rounded">
                  <h6 className="mb-3">Saved Shipping Address</h6>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handleUseAddress(userAddresses.shippingAddress)}
                  >
                    Use Saved Address
                  </button>
                  <div className="mt-2">
                    <small>
                      <strong>{userAddresses.shippingAddress.name}</strong><br />
                      {userAddresses.shippingAddress.phone}<br />
                      {userAddresses.shippingAddress.address}<br />
                      {userAddresses.shippingAddress.city}, {userAddresses.shippingAddress.postalCode} {userAddresses.shippingAddress.country}
                    </small>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-control"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    required
                    rows="3"
                  />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">City</label>
                    <input
                      className="form-control"
                      value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Postal Code</label>
                    <input
                      className="form-control"
                      value={form.postalCode}
                      onChange={e => setForm({ ...form, postalCode: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Country</label>
                  <input
                    className="form-control"
                    value={form.country}
                    onChange={e => setForm({ ...form, country: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email (optional)</label>
                  <input
                    className="form-control"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                {/* Payment Method Selection */}
                <div className="mb-3">
                  <label className="form-label"><strong>Payment Method</strong></label>
                  {settingsLoading ? (
                    <p>Loading payment methods...</p>
                  ) : (
                    <div>
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="cod"
                          name="payment"
                          value="cash_on_delivery"
                          checked={paymentMethod === 'cash_on_delivery'}
                          onChange={e => setPaymentMethod(e.target.value)}
                        />
                        <label className="form-check-label" htmlFor="cod">
                          Cash on Delivery
                        </label>
                      </div>
                      {settings?.paymentMethods?.map(method => (
                        method.enabled && (
                          <div key={method.name} className="form-check mb-2">
                            <input
                              className="form-check-input"
                              type="radio"
                              id={method.name}
                              name="payment"
                              value={method.name}
                              checked={paymentMethod === method.name}
                              onChange={e => setPaymentMethod(e.target.value)}
                            />
                            <label className="form-check-label" htmlFor={method.name}>
                              {PAYMENT_METHOD_LABELS[method.name] || method.name}
                            </label>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>

                <button
                  className="btn btn-success w-100"
                  disabled={loading}
                >
                  {loading ? 'Placing Order...' : `Place Order (${paymentMethod === 'cash_on_delivery' ? 'COD' : (PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod)})`}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Cart Items Summary */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header bg-white  border-bottom-0">
              <h5>Order Summary</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, idx) => (
                      <tr key={`${item.product || idx}-${item.variationId || ''}`}>
                        <td>
                          {item.name || 'Product'}
                          {item.size && <div><small className="text-muted">Size: {item.size}</small></div>}
                        </td>
                        <td>{item.qty}</td>
                        <td>{currencySymbol}{item.price.toFixed(2)}</td>
                        <td>{currencySymbol}{(item.price * item.qty).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <strong>Total Amount:</strong>
                <strong style={{ color: '#28a745', fontSize: '1.2rem' }}>{currencySymbol}{totalAmount.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>


      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
