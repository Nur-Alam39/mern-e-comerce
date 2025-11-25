import React, { useRef, useEffect, useState } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminNavbar.css';

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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
      <div className="admin-navbar__right">
        <span className="admin-navbar__name">{user?.name || 'Admin'}</span>
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
