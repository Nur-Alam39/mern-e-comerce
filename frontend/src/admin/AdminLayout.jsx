import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  // Determine active based on pathname or query
  const getActiveFromPath = (pathname, search) => {
    const urlParams = new URLSearchParams(search);
    const section = urlParams.get('section');
    if (section) return section;
    if (pathname.includes('/categories')) return 'categories';
    if (pathname.includes('/products')) return 'products';
    if (pathname.includes('/orders')) return 'orders';
    if (pathname.includes('/customers')) return 'customers';
    if (pathname.includes('/pages')) return 'pages';
    if (pathname.includes('/sliders')) return 'sliders';
    if (pathname.includes('/settings')) return 'settings';
    if (pathname.includes('/payments')) return 'payments';
    if (pathname.includes('/couriers')) return 'couriers';
    return 'dashboard';
  };

  const active = getActiveFromPath(location.pathname, location.search);

  const handleSidebarChange = (key) => {
    navigate(`/admin?section=${key}`);
  };

  // Close sidebar on outside click for mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && window.innerWidth <= 991 && sidebarRef.current && !sidebarRef.current.contains(event.target) && !event.target.closest('.admin-navbar__hamburger')) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  return (
    <div className="admin-layout">
      <AdminNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <AdminSidebar ref={sidebarRef} active={active} onChange={handleSidebarChange} isOpen={sidebarOpen} />
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;