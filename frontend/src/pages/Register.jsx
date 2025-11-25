import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      alert('Register failed');
      console.log(err);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 420 }}>
      <h2>Register</h2>
      <form onSubmit={submit}>
        <div className="mb-2">
          <label className="form-label">Name</label>
          <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="mb-2">
          <label className="form-label">Email</label>
          <input className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="mb-2">
          <label className="form-label">Password</label>
          <input type="password" className="form-control" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        </div>
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
      </form>
    </div>
  );
}
