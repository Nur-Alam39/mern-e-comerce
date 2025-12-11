import React, { useRef, useEffect, useState } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/api';
import './AdminNavbar.css';

const AdminNavbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const dropdownRef = useRef(null);

  // Fetch currency
  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const res = await axios.get('/api/settings');
        setCurrency(res.data.currency || 'USD');
      } catch (err) {
        console.log('Failed to fetch currency', err);
      }
    };
    fetchCurrency();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowDropdown(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setShowDropdown(false);
  };

  return (
    <nav className="admin-navbar">
      <div className="admin-navbar__left">
        <button
          className="admin-navbar__hamburger d-lg-none"
          onClick={(e) => { e.stopPropagation(); setSidebarOpen(!sidebarOpen); }}
          aria-label="Toggle sidebar"
        >
          <i className={`fa ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
        <span className="admin-navbar__name">{user?.name || 'Admin'}</span>
        {/* <span className="admin-navbar__currency ms-3 badge bg-primary">{currency}</span> */}
      </div>
      <div className="admin-navbar__right">
        <button
          className="admin-navbar__shop-btn btn btn-sm btn-primary me-3"
          onClick={() => navigate('/')}
          title="Go to Shop"
        >
          <i className="fa fa-shopping-bag me-1"></i>
          Shop
        </button>
        <div className="admin-navbar__dropdown-wrapper" ref={dropdownRef}>
          <button
            className="admin-navbar__icon-btn"
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="Account menu"
          >
            <FaUserCircle size={32} />
          </button>
          {showDropdown && (
            <div className="admin-navbar__dropdown">
              {user?.role === 'admin' && (
                <a href="#" className="admin-navbar__dropdown-item" onClick={(e) => { e.preventDefault(); handleNavigation('/admin'); }}>
                  Admin Dashboard
                </a>
              )}
              <a href="#" className="admin-navbar__dropdown-item" onClick={(e) => { e.preventDefault(); handleNavigation('/profile'); }}>
                Profile
              </a>
              <a href="#" className="admin-navbar__dropdown-item" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                Logout
              </a>
              {!user && (
                <a href="#" className="admin-navbar__dropdown-item" onClick={(e) => { e.preventDefault(); handleNavigation('/register'); }}>
                  Sign Up
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
