import React, { useState, forwardRef } from 'react';
import './AdminSidebar.css';

const AdminSidebar = forwardRef(function AdminSidebar({ active, onChange, isOpen }, ref) {
  const [expandedSections, setExpandedSections] = useState({ settings: false });

  const mainItems = [
    { key: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
    { key: 'products', label: 'Products', icon: 'fa-box' },
    { key: 'categories', label: 'Categories', icon: 'fa-tags' },
    { key: 'orders', label: 'Orders', icon: 'fa-shopping-cart' },
    { key: 'customers', label: 'Customers', icon: 'fa-users' },
    { key: 'pages', label: 'Pages', icon: 'fa-file-alt' },
    { key: 'sliders', label: 'Sliders', icon: 'fa-images' },
    { key: 'settings', label: 'General Settings', icon: 'fa-cog' },
    { key: 'payments', label: 'Payment Methods', icon: 'fa-credit-card' },
    { key: 'couriers', label: 'Courier Providers', icon: 'fa-truck' },
  ];

  const settingsItems = [
    { key: 'sliders', label: 'Sliders' },
    { key: 'settings', label: 'General Settings' },
    { key: 'payments', label: 'Payment Methods' },
    { key: 'couriers', label: 'Courier Providers' },
  ];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div ref={ref} className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      <ul className="admin-sidebar__nav">
        {mainItems.map(it => (
          <li key={it.key}>
            <button
              type="button"
              className={`admin-sidebar__nav-link ${active === it.key ? 'active' : ''}`}
              onClick={() => onChange(it.key)}
            >
              <i className={`fa ${it.icon}`}></i>
              {it.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});

export default AdminSidebar;
