import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../utils/api';

export default function AdminCouriers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const providerParam = searchParams.get('provider');
    if (providerParam) {
      const provider = providers.find(p => p.name === providerParam);
      setSelectedProvider(provider || null);
    } else {
      setSelectedProvider(null);
    }
  }, [searchParams, providers]);

  const load = async () => {
    try {
      const res = await axios.get('/api/settings');
      setProviders(res.data.courierProviders || []);
    } catch (err) {
      console.log('Failed to load courier providers', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProvider = async (name, updated) => {
    setSaving(true);
    try {
      await axios.put(`/api/settings/couriers/${encodeURIComponent(name)}`, {
        enabled: updated.enabled,
        config: updated.config
      });
      await load();
      alert('Provider updated successfully');
    } catch (err) {
      console.error('Failed to update provider', err);
      alert('Failed to update provider');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (name) => {
    const updated = providers.map(p => p.name === name ? { ...p, enabled: !p.enabled } : p);
    setProviders(updated);
  };

  const handleChangeConfig = (name, field, value) => {
    const updated = providers.map(p => p.name === name ? {
      ...p,
      config: { ...(p.config || {}), [field]: value }
    } : p);
    setProviders(updated);
  };

  if (loading) return <p>Loading...</p>;

  const getProviderLogo = (name) => {
    switch (name) {
      case 'steadfast':
        return 'https://portal.packzy.com/images/steadfast-logo.png';
      case 'pathao':
        return 'https://pathao.com/wp-content/themes/pathao/images/pathao-logo.png';
      default:
        return 'https://via.placeholder.com/40x40?text=' + name.charAt(0).toUpperCase();
    }
  };

  const isConfigured = (provider) => {
    if (provider.name === 'steadfast') {
      return provider.config && provider.config.apiKey && provider.config.secretKey;
    } else if (provider.name === 'pathao') {
      return provider.config && provider.config.clientId && provider.config.clientSecret &&
        provider.config.username && provider.config.password && provider.config.storeId;
    }
    return false;
  };

  // Detail view component
  const renderDetailView = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>{`Configure ${selectedProvider.name.charAt(0).toUpperCase() + selectedProvider.name.slice(1)} Courier`}</h3>
        <div className="d-flex gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => setSearchParams({ section: 'couriers' })}
          >
            ← Back to Couriers
          </button>
          <button
            className="btn btn-primary"
            onClick={() => updateProvider(selectedProvider.name, selectedProvider)}
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
              <h5>Provider Settings</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Provider Status</label>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={selectedProvider.enabled || false}
                    onChange={(e) => {
                      const updated = providers.map(p => p.name === selectedProvider.name ? { ...p, enabled: e.target.checked } : p);
                      setProviders(updated);
                      setSelectedProvider({ ...selectedProvider, enabled: e.target.checked });
                    }}
                  />
                  <label className="form-check-label">
                    {selectedProvider.enabled ? 'Enabled' : 'Disabled'}
                  </label>
                </div>
                <small className="text-muted">
                  Enable this provider to make it available for shipping orders
                </small>
              </div>

              {selectedProvider.name === 'steadfast' && (
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">API Key *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={(selectedProvider.config && selectedProvider.config.apiKey) || ''}
                      onChange={(e) => handleChangeConfig(selectedProvider.name, 'apiKey', e.target.value)}
                      placeholder="Enter your Steadfast API Key"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Secret Key *</label>
                    <input
                      type="password"
                      className="form-control"
                      value={(selectedProvider.config && selectedProvider.config.secretKey) || ''}
                      onChange={(e) => handleChangeConfig(selectedProvider.name, 'secretKey', e.target.value)}
                      placeholder="Enter your Steadfast Secret Key"
                    />
                  </div>
                </div>
              )}

              {selectedProvider.name === 'pathao' && (
                <div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Client ID *</label>
                      <input
                        type="text"
                        className="form-control mb-3"
                        value={(selectedProvider.config && selectedProvider.config.clientId) || ''}
                        onChange={(e) => handleChangeConfig(selectedProvider.name, 'clientId', e.target.value)}
                        placeholder="Enter your Pathao Client ID"
                      />
                      <label className="form-label">Client Secret *</label>
                      <input
                        type="password"
                        className="form-control mb-3"
                        value={(selectedProvider.config && selectedProvider.config.clientSecret) || ''}
                        onChange={(e) => handleChangeConfig(selectedProvider.name, 'clientSecret', e.target.value)}
                        placeholder="Enter your Pathao Client Secret"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Username (Email) *</label>
                      <input
                        type="email"
                        className="form-control mb-3"
                        value={(selectedProvider.config && selectedProvider.config.username) || ''}
                        onChange={(e) => handleChangeConfig(selectedProvider.name, 'username', e.target.value)}
                        placeholder="Enter your Pathao login email"
                      />
                      <label className="form-label">Password *</label>
                      <input
                        type="password"
                        className="form-control mb-3"
                        value={(selectedProvider.config && selectedProvider.config.password) || ''}
                        onChange={(e) => handleChangeConfig(selectedProvider.name, 'password', e.target.value)}
                        placeholder="Enter your Pathao login password"
                      />
                      <label className="form-label">Store ID *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={(selectedProvider.config && selectedProvider.config.storeId) || ''}
                        onChange={(e) => handleChangeConfig(selectedProvider.name, 'storeId', e.target.value)}
                        placeholder="Enter your Pathao Store ID"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">API URL (Optional)</label>
                    <input
                      type="url"
                      className="form-control"
                      value={(selectedProvider.config && selectedProvider.config.baseUrl) || ''}
                      onChange={(e) => handleChangeConfig(selectedProvider.name, 'baseUrl', e.target.value)}
                      placeholder="https://api-hermes.pathao.com"
                    />
                    <small className="text-muted">Leave empty to use default Pathao API endpoint</small>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h6>Configuration Status</h6>
            </div>
            <div className="card-body">
              {isConfigured(selectedProvider) ? (
                <div className="alert alert-success">
                  <i className="fa fa-check-circle"></i> All required fields are configured
                </div>
              ) : (
                <div className="alert alert-warning">
                  <i className="fa fa-exclamation-triangle"></i> Configuration incomplete
                </div>
              )}

              <div className="mb-3">
                <strong>Provider:</strong> {selectedProvider.name.charAt(0).toUpperCase() + selectedProvider.name.slice(1)}
              </div>
              <div className="mb-3">
                <strong>Status:</strong>
                <span className={`badge ms-2 ${selectedProvider.enabled ? 'bg-success' : 'bg-secondary'}`}>
                  {selectedProvider.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h6>Setup Instructions</h6>
            </div>
            <div className="card-body">
              {selectedProvider.name === 'steadfast' ? (
                <div>
                  <p><strong>Steadfast Courier Setup:</strong></p>
                  <ol>
                    <li>Log in to your Steadfast dashboard</li>
                    <li>Navigate to API settings</li>
                    <li>Generate or copy your API Key and Secret Key</li>
                    <li>Enter them in the fields above</li>
                    <li>Save changes</li>
                  </ol>
                </div>
              ) : selectedProvider.name === 'pathao' ? (
                <div>
                  <p><strong>Pathao Courier Setup:</strong></p>
                  <ol>
                    <li>Log in to your Pathao merchant account</li>
                    <li>Go to API settings or developer section</li>
                    <li>Get your Client ID and Client Secret</li>
                    <li>Note your Store ID</li>
                    <li>Use your login email and password</li>
                    <li>Enter all credentials above</li>
                    <li>Save changes</li>
                  </ol>
                </div>
              ) : null}
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
        <h3>Courier Providers</h3>
        <div className="d-flex gap-2">
          <button
            className="btn btn-primary"
            onClick={() => setSearchParams({ section: 'couriers', action: 'add' })}
          >
            <i className="fa fa-plus"></i> Add Provider
          </button>
        </div>
      </div>
      {providers.length === 0 ? (
        <div className="alert alert-info">
          <h6>No Courier Providers Configured</h6>
          <p className="mb-0">Get started by adding your first courier provider.</p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => setSearchParams({ section: 'couriers', action: 'add' })}
          >
            <i className="fa fa-plus"></i> Add First Provider
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Configuration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((provider, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={getProviderLogo(provider.name)}
                            alt={provider.name}
                            className="me-3"
                            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/40x40?text=' + provider.name.charAt(0).toUpperCase();
                            }}
                          />
                          <div>
                            <strong className="text-capitalize">{provider.name}</strong>
                            <br />
                            <small className="text-muted">
                              {provider.name === 'steadfast' ? 'Steadfast Courier' :
                                provider.name === 'pathao' ? 'Pathao Courier' : 'Unknown Provider'}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="form-check form-switch me-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={provider.enabled || false}
                              onChange={() => handleToggle(provider.name)}
                            />
                          </div>
                          <span className={`badge ${provider.enabled ? 'bg-success' : 'bg-secondary'}`}>
                            {provider.enabled ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td>
                        {isConfigured(provider) ? (
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
                            onClick={() => setSearchParams({ section: 'couriers', provider: provider.name })}
                            className="btn btn-outline-primary btn-sm"
                          >
                            <i className="fa fa-edit"></i> Edit
                          </button>
                          <button
                            className="btn btn-outline-success btn-sm"
                            onClick={() => updateProvider(provider.name, provider)}
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
        <h6>Courier Provider Management</h6>
        <ul className="mb-0">
          <li><strong>Status:</strong> Toggle providers active/inactive to control availability</li>
          <li><strong>Configuration:</strong> Green badge indicates all required credentials are set</li>
          <li><strong>Edit:</strong> Click Edit to configure API credentials and settings</li>
          <li><strong>Save:</strong> Save changes to apply configuration updates</li>
          <li><strong>Add Provider:</strong> Add new courier providers to expand shipping options</li>
        </ul>
      </div>
    </div>
  );

  return selectedProvider ? renderDetailView() : renderListView();
}
