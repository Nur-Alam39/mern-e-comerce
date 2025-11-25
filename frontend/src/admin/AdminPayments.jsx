import React, { useEffect, useState } from 'react';
import axios from '../utils/api';

export default function AdminPayments() {
  // Helper function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${axios.defaults.baseURL}${imagePath}`;
  };
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await axios.get('/api/settings');
      setMethods(res.data.paymentMethods || []);
    } catch (err) {
      console.error('Failed to load payment methods', err);
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (name) => {
    const item = methods.find(m => m.name === name) || { name, enabled: false, config: {} };
    const enabled = !item.enabled;
    setSaving(true);
    try {
      await axios.put(`/api/settings/payment/${name}`, { enabled, config: item.config || {} });
      await load();
    } catch (err) {
      console.error('Failed to update payment method', err);
      alert('Failed to update');
    } finally {
      setSaving(false);
    }
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

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h3 className="mb-4">Payment Methods</h3>
      <div className="card">
        <div className="card-body">
          {methods.length === 0 ? (
            <p className="text-muted">No payment methods configured.</p>
          ) : (
            <div>
              {methods.map(m => (
                <div key={m.name} className="mb-4 p-3 border rounded">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div>
                      <strong>{m.name}</strong>
                      <div><small className="text-muted">{m.config ? JSON.stringify(m.config) : ''}</small></div>
                    </div>
                    <div>
                      <button className={`btn btn-sm ${m.enabled ? 'btn-danger' : 'btn-success'}`} onClick={() => toggle(m.name)} disabled={saving}>
                        {m.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <label className="form-label">Logo</label>
                      <input
                        type="file"
                        className="form-control form-control-sm"
                        accept="image/*"
                        onChange={(e) => uploadLogo(m.name, e.target.files[0])}
                        disabled={saving}
                      />
                    </div>
                    <div className="col-md-6">
                      {m.logo && (
                        <div>
                          <small className="text-muted">Current Logo:</small><br />
                          <img src={getImageUrl(m.logo)} alt={`${m.name} logo`} style={{ maxWidth: '50px', maxHeight: '50px' }} />
                        </div>
                      )}
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
