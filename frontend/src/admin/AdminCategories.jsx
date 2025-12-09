import React, { useEffect, useState } from 'react';
import axios from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetch = async () => {
    try { const res = await axios.get('/api/categories'); setCategories(Array.isArray(res.data) ? res.data : []); } catch (err) { console.log(err); }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await fetch();
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const handleCreate = () => navigate('/admin/categories/create');
  const handleEdit = (c) => navigate(`/admin/categories/edit/${c._id}`);
  const handleDelete = async (c) => {
    if (!window.confirm(`Delete category ${c.name}?`)) return;
    try {
      await axios.delete(`/api/categories/${c._id}`);
      await fetch();
    } catch (err) {
      console.log(err);
      const errorMessage = err.response?.data?.message || 'Delete failed';
      alert(errorMessage);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Categories</h3>
        <button className="btn btn-success" onClick={handleCreate}>Add Category</button>
      </div>
      {loading ? <p>Loading...</p> : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Parent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c._id}>
                  <td><strong>{c.name}</strong></td>
                  <td>
                    {c.main ? (
                      <span className="badge bg-success">Main</span>
                    ) : (
                      <span className="badge bg-secondary">Sub</span>
                    )}
                  </td>
                  <td>{c.parent ? c.parent : '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => handleEdit(c)}>Edit</button>
                    {/* <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c)}>Delete</button> */}
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
