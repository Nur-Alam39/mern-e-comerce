import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import axios from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function AdminCategoryCreate() {
  const [form, setForm] = useState({ name: '', parent: '', main: false, showInNavbar: false });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const load = async () => {
      try {
        const res = await axios.get('/api/categories');
        setCategories(Array.isArray(res.data) ? res.data : []);
        if (id) {
          const r = await axios.get(`/api/categories`);
          // find category by id
          const found = (Array.isArray(r.data) ? r.data : []).find(c => c._id === id);
          if (found) {
            setForm(prev => ({ ...prev, name: found.name || '', parent: found.parent || '', main: !!found.main, showInNavbar: !!found.showInNavbar }));
            if (found.image) setImagePreview(`${axios.defaults.baseURL}${found.image}`);
          }
        }
      } catch (err) { console.log(err); }
      setLoading(false);
    };
    load();
  }, [id, navigate, user]);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Revoke previous object URL if exists
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setForm({ ...form, imageFile: file });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('parent', form.parent || '');
      data.append('main', form.main ? 'true' : 'false');
      data.append('showInNavbar', form.showInNavbar ? 'true' : 'false');
      if (form.imageFile) data.append('image', form.imageFile);
      if (id) await axios.put(`/api/categories/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await axios.post('/api/categories', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      // go back to admin and open categories
      navigate('/admin?section=categories');
    } catch (err) { console.log(err); alert('Save failed'); }
  };

  return (
    <div>
      <div className="row">
        <div className="col-md-9">
          <h3>{id ? 'Edit Category' : 'Create Category'}</h3>
          {loading ? <p>Loading...</p> : (
            <form onSubmit={submit} style={{ maxWidth: 600 }} encType="multipart/form-data">
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Parent Category (optional)</label>
                <select className="form-select" value={form.parent || ''} onChange={e => setForm({ ...form, parent: e.target.value })}>
                  <option value="">-- None --</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Image (optional)</label>
                <input type="file" accept="image/*" className="form-control" onChange={handleImageChange} />
                {imagePreview && (
                  <div className="mt-2">
                    <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
              <div className="mb-3 form-check">
                <input className="form-check-input" type="checkbox" id="mainCheck" checked={form.main} onChange={e => setForm({ ...form, main: e.target.checked })} />
                <label className="form-check-label" htmlFor="mainCheck">Mark as main category</label>
              </div>
              <div className="mb-3 form-check">
                <input className="form-check-input" type="checkbox" id="navbarCheck" checked={form.showInNavbar} onChange={e => setForm({ ...form, showInNavbar: e.target.checked })} />
                <label className="form-check-label" htmlFor="navbarCheck">Show in navbar</label>
              </div>
              <div>
                <button className="btn btn-primary" type="submit">Save</button>
                <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/admin?section=categories')}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
