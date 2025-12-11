import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../utils/api';

export default function AdminPayments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const methodParam = searchParams.get('method');
    if (methodParam) {
      const method = methods.find(m => m.name === methodParam);
      setSelectedMethod(method || null);
    } else {
      setSelectedMethod(null);
    }
  }, [searchParams, methods]);

  const load = async () => {
    try {
      const res = await axios.get('/api/settings');
      setMethods(res.data.paymentMethods || []);
    } catch (err) {
      console.log('Failed to load payment methods', err);
    } finally {
      setLoading(false);
    }
  };

  const updateMethod = async (name, updated) => {
    setSaving(true);
    try {
      await axios.put(`/api/settings/payment/${encodeURIComponent(name)}`, {
        enabled: updated.enabled,
        config: updated.config
      });
      await load();
      alert('Payment method updated successfully');
    } catch (err) {
      console.error('Failed to update payment method', err);
      alert('Failed to update payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (name) => {
    const updated = methods.map(m => m.name === name ? { ...m, enabled: !m.enabled } : m);
    setMethods(updated);
  };

  const handleChangeConfig = (name, field, value) => {
    const updated = methods.map(m => m.name === name ? {
      ...m,
      config: { ...(m.config || {}), [field]: value }
    } : m);
    setMethods(updated);
    if (selectedMethod && selectedMethod.name === name) {
      setSelectedMethod({
        ...selectedMethod,
        config: { ...(selectedMethod.config || {}), [field]: value }
      });
    }
  };

  // Helper function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${axios.defaults.baseURL}${imagePath}`;
  };

  const uploadLogo = async (name, file) => {
    if (!file) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      await axios.put(`/api/settings/payment/${name}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await load();
    } catch (err) {
      console.error('Failed to upload logo', err);
      alert('Failed to upload logo');
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = (method) => {
    if (method.name === 'ssl_commerce') {
      return method.config && method.config.storeId && method.config.storePassword;
    }
    return method.config && method.config.apiKey && method.config.secretKey;
  };

  const getMethodLogo = (method) => {
    if (method.logo) {
      return getImageUrl(method.logo);
    }
    // Fallback to placeholder
    return 'https://via.placeholder.com/40x40?text=' + method.name.charAt(0).toUpperCase();
  };

  if (loading) return <p>Loading...</p>;

  // Detail view component
  const renderDetailView = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>{`Configure ${selectedMethod.name.charAt(0).toUpperCase() + selectedMethod.name.slice(1)} Payment Method`}</h3>
        <div className="d-flex gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => setSearchParams({ section: 'payments' })}
          >
            <i className='fa fa-cheveron-left'></i> Back to Payment Methods
          </button>
          <button
            className="btn btn-primary"
            onClick={() => updateMethod(selectedMethod.name, selectedMethod)}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5>Payment Method Settings</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Method Status</label>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={selectedMethod.enabled || false}
                    onChange={(e) => {
                      const updated = methods.map(m => m.name === selectedMethod.name ? { ...m, enabled: e.target.checked } : m);
                      setMethods(updated);
                      setSelectedMethod({ ...selectedMethod, enabled: e.target.checked });
                    }}
                  />
                  <label className="form-check-label">
                    {selectedMethod.enabled ? 'Enabled' : 'Disabled'}
                  </label>
                </div>
                <small className="text-muted">
                  Enable this payment method to make it available for customers
                </small>
              </div>

              {selectedMethod.name === 'ssl_commerce' ? (
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Store ID *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={(selectedMethod.config && selectedMethod.config.storeId) || ''}
                      onChange={(e) => handleChangeConfig(selectedMethod.name, 'storeId', e.target.value)}
                      placeholder="Enter your Store ID"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Store Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      value={(selectedMethod.config && selectedMethod.config.storePassword) || ''}
                      onChange={(e) => handleChangeConfig(selectedMethod.name, 'storePassword', e.target.value)}
                      placeholder="Enter your Store Password"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Live Mode</label>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={(selectedMethod.config && selectedMethod.config.isLive) || false}
                        onChange={(e) => handleChangeConfig(selectedMethod.name, 'isLive', e.target.checked)}
                      />
                      <label className="form-check-label">
                        {(selectedMethod.config && selectedMethod.config.isLive) ? 'Live' : 'Sandbox'}
                      </label>
                    </div>
                    <small className="text-muted">
                      Enable for live transactions, disable for testing
                    </small>
                  </div>
                </div>
              ) : (
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">API Key *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={(selectedMethod.config && selectedMethod.config.apiKey) || ''}
                      onChange={(e) => handleChangeConfig(selectedMethod.name, 'apiKey', e.target.value)}
                      placeholder="Enter your API Key"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Secret Key *</label>
                    <input
                      type="password"
                      className="form-control"
                      value={(selectedMethod.config && selectedMethod.config.secretKey) || ''}
                      onChange={(e) => handleChangeConfig(selectedMethod.name, 'secretKey', e.target.value)}
                      placeholder="Enter your Secret Key"
                    />
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Logo</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={(e) => uploadLogo(selectedMethod.name, e.target.files[0])}
                  disabled={saving}
                />
                {selectedMethod.logo && (
                  <div className="mt-2">
                    <small className="text-muted">Current Logo:</small><br />
                    <img src={getImageUrl(selectedMethod.logo)} alt={`${selectedMethod.name} logo`} style={{ maxWidth: '100px', maxHeight: '100px' }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h6>Configuration Status</h6>
            </div>
            <div className="card-body">
              {isConfigured(selectedMethod) ? (
                <div className="alert alert-success">
                  <i className="fa fa-check-circle"></i> All required fields are configured
                </div>
              ) : (
                <div className="alert alert-warning">
                  <i className="fa fa-exclamation-triangle"></i> Configuration incomplete
                </div>
              )}

              <div className="mb-3">
                <strong>Method:</strong> {selectedMethod.name.charAt(0).toUpperCase() + selectedMethod.name.slice(1)}
              </div>
              <div className="mb-3">
                <strong>Status:</strong>
                <span className={`badge ms-2 ${selectedMethod.enabled ? 'bg-success' : 'bg-secondary'}`}>
                  {selectedMethod.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h6>Setup Instructions</h6>
            </div>
            <div className="card-body">
              <p><strong>Payment Method Setup:</strong></p>
              {selectedMethod.name === 'ssl_commerce' ? (
                <ol>
                  <li>Log in to your SSL Commerz merchant dashboard</li>
                  <li>Navigate to Settings  &gt; API Settings</li>
                  <li>Copy your Store ID and Store Password</li>
                  <li>Enter Store ID and Store Password in the fields above</li>
                  <li>Set Live Mode to true for production, false for testing</li>
                  <li>Upload a logo if desired</li>
                  <li>Save changes</li>
                </ol>
              ) : (
                <ol>
                  <li>Log in to your payment provider dashboard</li>
                  <li>Navigate to API or developer settings</li>
                  <li>Generate or copy your API Key and Secret Key</li>
                  <li>Enter them in the fields above</li>
                  <li>Upload a logo if desired</li>
                  <li>Save changes</li>
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // List view component
  const renderListView = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Payment Methods</h3>
      </div>
      {methods.length === 0 ? (
        <div className="alert alert-info">
          <h6>No Payment Methods Configured</h6>
          <p className="mb-0">Get started by configuring your first payment method.</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Configuration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {methods.map((method, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={getMethodLogo(method)}
                            alt={method.name}
                            className="me-3"
                            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/40x40?text=' + method.name.charAt(0).toUpperCase();
                            }}
                          />
                          <div>
                            <strong className="text-capitalize">{method.name}</strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="form-check form-switch me-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={method.enabled || false}
                              onChange={() => handleToggle(method.name)}
                            />
                          </div>
                          <span className={`badge ${method.enabled ? 'bg-success' : 'bg-secondary'}`}>
                            {method.enabled ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td>
                        {isConfigured(method) ? (
                          <span className="badge bg-success">
                            <i className="fa fa-check"></i> Configured
                          </span>
                        ) : (
                          <span className="badge bg-warning">
                            <i className="fa fa-exclamation-triangle"></i> Incomplete
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            onClick={() => setSearchParams({ section: 'payments', method: method.name })}
                            className="btn btn-outline-primary btn-sm"
                          >
                            <i className="fa fa-edit"></i> Edit
                          </button>
                          <button
                            className="btn btn-outline-success btn-sm"
                            onClick={() => updateMethod(method.name, method)}
                            disabled={saving}
                          >
                            <i className="fa fa-save"></i> {saving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="alert alert-info mt-4">
        <h6>Payment Method Management</h6>
        <ul className="mb-0">
          <li><strong>Status:</strong> Toggle methods active/inactive to control availability</li>
          <li><strong>Configuration:</strong> Green badge indicates API Key and Secret Key are set</li>
          <li><strong>Edit:</strong> Click Edit to configure API credentials and settings</li>
          <li><strong>Save:</strong> Save changes to apply configuration updates</li>
        </ul>
      </div>
    </div>
  );

  return selectedMethod ? renderDetailView() : renderListView();
}
