import React, { useEffect, useState } from 'react';
import axios from '../utils/api';
import { useNavigate, useParams } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../context/AuthContext';

export default function AdminSliderEdit() {
  const [form, setForm] = useState({ title: '', subtitle: '', ctaText: '', ctaLink: '', order: 0 });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const load = async () => {
      if (id) {
        try {
          const res = await axios.get(`/api/sliders`);
          const found = (Array.isArray(res.data) ? res.data : []).find(s => s._id === id);
          if (found) setForm({ title: found.title || '', subtitle: found.subtitle || '', ctaText: found.ctaText || '', ctaLink: found.ctaLink || '', order: found.order || 0 });
        } catch (err) { console.log(err); }
      }
      setLoading(false);
    };
    load();
  }, [id, navigate, user]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('subtitle', form.subtitle);
      data.append('ctaText', form.ctaText);
      data.append('ctaLink', form.ctaLink);
      data.append('order', form.order);
      if (file) data.append('image', file);
      if (id) await axios.put(`/api/sliders/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await axios.post('/api/sliders', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/admin/sliders');
    } catch (err) { console.log(err); alert('Save failed'); }
  };

  return (
    <div className='container'>
      <div className="row">
        <div className="col-md-3 mb-3">
          <AdminSidebar active={'categories'} onChange={(s) => navigate(`/admin?section=${s}`)} />
        </div>
        <div className="col-md-9">
          <h3>{id ? 'Edit Slider' : 'Create Slider'}</h3>
          {loading ? <p>Loading...</p> : (
            <form onSubmit={submit} style={{ maxWidth: 700 }}>
              <div className="mb-3">
                <label className="form-label">Title</label>
                <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label">Subtitle</label>
                <input className="form-control" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label">CTA Text</label>
                <input className="form-control" value={form.ctaText} onChange={e => setForm({ ...form, ctaText: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label">CTA Link</label>
                <input className="form-control" value={form.ctaLink} onChange={e => setForm({ ...form, ctaLink: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label">Order</label>
                <input type="number" className="form-control" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} />
              </div>
              <div className="mb-3">
                <label className="form-label">Image</label>
                <input type="file" accept="image/*" className="form-control" onChange={e => setFile(e.target.files[0])} />
              </div>
              <div>
                <button className="btn btn-primary" type="submit">Save</button>
                <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/admin/sliders')}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
