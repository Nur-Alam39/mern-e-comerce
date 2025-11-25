import React, { useEffect, useState } from 'react';
import axios from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminSliders() {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetch = async () => {
    try { const res = await axios.get('/api/sliders'); setSliders(Array.isArray(res.data) ? res.data : []); } catch (err) { console.log(err); }
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    let mounted = true;
    (async () => {
      setLoading(true);
      await fetch();
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [user, navigate]);

  const handleCreate = () => navigate('/admin/sliders/create');
  const handleEdit = (s) => navigate(`/admin/sliders/edit/${s._id}`);
  const handleDelete = async (s) => {
    if (!window.confirm(`Delete slider ${s.title || s._id}?`)) return;
    try { await axios.delete(`/api/sliders/${s._id}`); await fetch(); } catch (err) { console.log(err); alert('Delete failed'); }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Sliders</h3>
        <button className="btn btn-success" onClick={handleCreate}>Add Slider</button>
      </div>
      {loading ? <p>Loading...</p> : (
        <ul className="list-group">
          {sliders.map(s => (
            <li key={s._id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <strong>{s.title || '(no title)'}</strong>
                {s.subtitle ? <div className="small text-muted">{s.subtitle}</div> : null}
              </div>
              <div>
                <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => handleEdit(s)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
