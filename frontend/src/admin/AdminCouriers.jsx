import React, { useEffect, useState } from 'react';
import axios from '../utils/api';

export default function AdminCouriers() {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiUrl, setNewApiUrl] = useState('');
  const [newSecret, setNewSecret] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await axios.get('/api/settings');
      setProviders(res.data.courierProviders || []);
    } catch (err) {
      console.error('Failed to load courier providers', err);
    } finally {
      setLoading(false);
    }
  };

  const addProvider = async () => {
    const name = (newName || '').trim();
    if (!name) return alert('Enter provider name');
    const payload = { enabled: true, config: { apiKey: newApiKey || '', apiUrl: newApiUrl || '', secret: newSecret || '' } };
    setSaving(true);
    try {
      await axios.put(`/api/settings/couriers/${encodeURIComponent(name)}`, payload);
      // Clear form
      setNewName(''); setNewApiKey(''); setNewApiUrl(''); setNewSecret('');
      await load();
      alert('Provider added');
    } catch (err) {
      console.error('Failed to add provider', err);
      alert('Failed to add provider');
    } finally {
      setSaving(false);
    }
  };

  const updateProvider = async (name, updated) => {
    setSaving(true);
    try {
      await axios.put(`/api/settings/couriers/${name}`, { enabled: updated.enabled, config: updated.config });
      await load();
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

  const handleChangeConfig = (name, key, value) => {
    const updated = providers.map(p => p.name === name ? { ...p, config: { ...(p.config || {}), [key]: value } } : p);
    setProviders(updated);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h3 className="mb-4">Courier Providers</h3>
      <div className="card">
        <div className="card-body">
          {/* Add new provider */}
          <div className="mb-4 border-bottom pb-3">
            <h6>Add New Provider</h6>
            <div className="row g-2 align-items-end">
              <div className="col-md-3">
                <label className="form-label">Name</label>
                <input className="form-control" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. pathao" />
              </div>
              <div className="col-md-3">
                <label className="form-label">API Key</label>
                <input className="form-control" value={newApiKey} onChange={e => setNewApiKey(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label">API URL</label>
                <input className="form-control" value={newApiUrl} onChange={e => setNewApiUrl(e.target.value)} />
              </div>
              <div className="col-md-2">
                <label className="form-label">Secret</label>
                <input className="form-control" value={newSecret} onChange={e => setNewSecret(e.target.value)} />
              </div>
              <div className="col-md-1">
                <button className="btn btn-primary w-100" onClick={addProvider} disabled={saving || !newName}>Add</button>
              </div>
            </div>
          </div>

          {providers.length === 0 ? (
            <p className="text-muted">No courier providers configured. Add them above or create via API.</p>
          ) : (
            <div>
              {providers.map(p => (
                <div key={p.name} className="mb-4 border-bottom pb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>{p.name}</strong>
                    <div>
                      <button className={`btn btn-sm ${p.enabled ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(p.name)} disabled={saving}>
                        {p.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button className="btn btn-sm btn-secondary ms-2" onClick={() => updateProvider(p.name, p)} disabled={saving}>Save</button>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-2">
                      <label className="form-label">API Key</label>
                      <input className="form-control" value={(p.config && p.config.apiKey) || ''} onChange={(e) => handleChangeConfig(p.name, 'apiKey', e.target.value)} />
                    </div>
                    <div className="col-md-4 mb-2">
                      <label className="form-label">API URL</label>
                      <input className="form-control" value={(p.config && p.config.apiUrl) || ''} onChange={(e) => handleChangeConfig(p.name, 'apiUrl', e.target.value)} />
                    </div>
                    <div className="col-md-4 mb-2">
                      <label className="form-label">Secret</label>
                      <input className="form-control" value={(p.config && p.config.secret) || ''} onChange={(e) => handleChangeConfig(p.name, 'secret', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
