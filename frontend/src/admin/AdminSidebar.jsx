import React, { useState } from 'react';

export default function AdminSidebar({ active, onChange }) {
  const [expandedSections, setExpandedSections] = useState({ settings: false });

  const mainItems = [
    { key: 'products', label: 'Products' },
    { key: 'categories', label: 'Categories' },
    { key: 'orders', label: 'Orders' },
    { key: 'customers', label: 'Customers' },
    { key: 'pages', label: 'Pages' },
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
    <div className="card">
      <div className="card-body p-2">
        <h5 className="card-title">Admin</h5>
        <div className="list-group list-group-flush">
          {mainItems.map(it => (
            <button
              key={it.key}
              type="button"
              className={`list-group-item list-group-item-action text-start ${active === it.key ? 'active' : ''}`}
              onClick={() => onChange(it.key)}
            >
              {it.label}
            </button>
          ))}

          {/* Settings Section */}
          <div>
            <button
              type="button"
              className={`list-group-item list-group-item-action text-start d-flex justify-content-between align-items-center ${active === 'settings' || active === 'sliders' ? 'active' : ''}`}
              onClick={() => toggleSection('settings')}
            >
              <span>Settings</span>
              <i className={`fa-solid fa-chevron-${expandedSections.settings ? 'down' : 'right'}`}></i>
            </button>
            {expandedSections.settings && (
              <div className="ms-3 border-top">
                {settingsItems.map(it => (
                  <button
                    key={it.key}
                    type="button"
                    className={`list-group-item list-group-item-action text-start ps-4 ${active === it.key ? 'active' : ''}`}
                    onClick={() => onChange(it.key)}
                  >
                    {it.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
