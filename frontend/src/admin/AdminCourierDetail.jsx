import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../utils/api';
import AdminPageLayout from './AdminPageLayout';

export default function AdminCourierDetail() {
  const { providerName } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    loadProvider();
  }, [providerName]);

  const loadProvider = async () => {
    try {
      const res = await axios.get('/api/settings');
      const courierProviders = res.data.courierProviders || [];
      const found = courierProviders.find(p => p.name === providerName);
      if (found) {
        setProvider(found);
      } else {
        alert('Provider not found');
        navigate('/admin/couriers');
      }
    } catch (err) {
      console.log('Failed to load provider', err);
      alert('Failed to load provider');
      navigate('/admin/couriers');
    } finally {
      setLoading(false);
    }
  };

  const updateProvider = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/settings/couriers/${encodeURIComponent(provider.name)}`, {
        enabled: provider.enabled,
        config: provider.config
      });
      alert('Provider updated successfully');
      navigate('/admin/couriers');
    } catch (err) {
      console.error('Failed to update provider', err);
      alert('Failed to update provider');
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setProvider(prev => ({
      ...prev,
      config: { ...(prev.config || {}), [field]: value }
    }));
  };

  const isConfigured = () => {
    if (provider.name === 'steadfast') {
      return provider.config && provider.config.apiKey && provider.config.secretKey;
    } else if (provider.name === 'pathao') {
      return provider.config && provider.config.clientId && provider.config.clientSecret &&
             provider.config.username && provider.config.password && provider.config.storeId;
    }
    return false;
  };

  if (loading) return <AdminPageLayout title="Loading..."><p>Loading...</p></AdminPageLayout>;

  if (!provider) return <AdminPageLayout title="Not Found"><p>Provider not found</p></AdminPageLayout>;

  return (
    <AdminPageLayout
      title={`Configure ${provider.name.charAt(0).toUpperCase() + provider.name.slice(1)} Courier`}
      actions={
        <>
          <Link to="/admin/couriers" className="btn btn-secondary">
            ← Back to Couriers
          </Link>
          <button
            className="btn btn-primary"
            onClick={updateProvider}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </>
      }
    >
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
                    checked={provider.enabled || false}
                    onChange={(e) => setProvider(prev => ({ ...prev, enabled: e.target.checked }))}
                  />
                  <label className="form-check-label">
                    {provider.enabled ? 'Enabled' : 'Disabled'}
                  </label>
                </div>
                <small className="text-muted">
                  Enable this provider to make it available for shipping orders
                </small>
              </div>

              {provider.name === 'steadfast' && (
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">API Key *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={(provider.config && provider.config.apiKey) || ''}
                      onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                      placeholder="Enter your Steadfast API Key"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Secret Key *</label>
                    <input
                      type="password"
                      className="form-control"
                      value={(provider.config && provider.config.secretKey) || ''}
                      onChange={(e) => handleConfigChange('secretKey', e.target.value)}
                      placeholder="Enter your Steadfast Secret Key"
                    />
                  </div>
                </div>
              )}

              {provider.name === 'pathao' && (
                <div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Client ID *</label>
                      <input
                        type="text"
                        className="form-control mb-3"
                        value={(provider.config && provider.config.clientId) || ''}
                        onChange={(e) => handleConfigChange('clientId', e.target.value)}
                        placeholder="Enter your Pathao Client ID"
                      />
                      <label className="form-label">Client Secret *</label>
                      <input
                        type="password"
                        className="form-control mb-3"
                        value={(provider.config && provider.config.clientSecret) || ''}
                        onChange={(e) => handleConfigChange('clientSecret', e.target.value)}
                        placeholder="Enter your Pathao Client Secret"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Username (Email) *</label>
                      <input
                        type="email"
                        className="form-control mb-3"
                        value={(provider.config && provider.config.username) || ''}
                        onChange={(e) => handleConfigChange('username', e.target.value)}
                        placeholder="Enter your Pathao login email"
                      />
                      <label className="form-label">Password *</label>
                      <input
                        type="password"
                        className="form-control mb-3"
                        value={(provider.config && provider.config.password) || ''}
                        onChange={(e) => handleConfigChange('password', e.target.value)}
                        placeholder="Enter your Pathao login password"
                      />
                      <label className="form-label">Store ID *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={(provider.config && provider.config.storeId) || ''}
                        onChange={(e) => handleConfigChange('storeId', e.target.value)}
                        placeholder="Enter your Pathao Store ID"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">API URL (Optional)</label>
                    <input
                      type="url"
                      className="form-control"
                      value={(provider.config && provider.config.baseUrl) || ''}
                      onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
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
              {isConfigured() ? (
                <div className="alert alert-success">
                  <i className="fa fa-check-circle"></i> All required fields are configured
                </div>
              ) : (
                <div className="alert alert-warning">
                  <i className="fa fa-exclamation-triangle"></i> Configuration incomplete
                </div>
              )}

              <div className="mb-3">
                <strong>Provider:</strong> {provider.name.charAt(0).toUpperCase() + provider.name.slice(1)}
              </div>
              <div className="mb-3">
                <strong>Status:</strong>
                <span className={`badge ms-2 ${provider.enabled ? 'bg-success' : 'bg-secondary'}`}>
                  {provider.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h6>Setup Instructions</h6>
            </div>
            <div className="card-body">
              {provider.name === 'steadfast' ? (
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
              ) : provider.name === 'pathao' ? (
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
    </AdminPageLayout>
  );
}