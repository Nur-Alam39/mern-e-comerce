import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem('token'); } catch { return null; }
  });
  const [user, setUser] = useState(() => {
    try { const raw = localStorage.getItem('user'); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  const login = async ({ email, password }) => {
    const res = await axios.post('/api/users/login', { email, password });
    if (res && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return res;
  };

  const register = async ({ name, email, password }) => {
    const res = await axios.post('/api/users/register', { name, email, password });
    if (res && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return res;
  };

  const logout = () => { setToken(null); setUser(null); };

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
