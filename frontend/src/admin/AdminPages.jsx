import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/api';

export default function AdminPages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPages = async () => {
    try {
      const res = await axios.get('/api/pages');
      setPages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log('Failed to load pages', err && err.message ? err.message : err);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await fetchPages();
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const handleEdit = (p) => {
    navigate(`/admin/pages/edit/${p._id}`);
  };

  const handleToggleActive = async (p) => {
    try {
      await axios.put(`/api/pages/${p._id}`, { active: !p.active });
      await fetchPages();
    } catch (err) {
      console.log('Failed to toggle status', err);
      alert('Failed to update page status');
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;
    try {
      await axios.delete(`/api/pages/${p._id}`);
      await fetchPages();
    } catch (err) {
      console.log('Failed to delete page', err);
      alert('Failed to delete page');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Pages</h3>
        <div>
          <button className="btn btn-secondary me-2" onClick={() => { navigate('/admin/pages/create'); }}> Add Page</button>
        </div>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="table-responsive">
          <table className="table table-sm table-hover">
            <thead className="table-light">
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map(p => (
                <tr key={p._id} className={p.active ? '' : 'table-secondary'}>
                  <td>{p.title}</td>
                  <td>{p.slug}</td>
                  <td>
                    <span className={`badge ${p.active ? 'bg-success' : 'bg-secondary'}`}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => handleEdit(p)}>Edit</button>
                    <button
                      className={`btn btn-sm ${p.active ? 'btn-warning' : 'btn-success'} me-2`}
                      onClick={() => handleToggleActive(p)}
                    >
                      {p.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}