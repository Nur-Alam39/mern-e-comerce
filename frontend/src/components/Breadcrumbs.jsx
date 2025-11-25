import React from 'react';
import { Link } from 'react-router-dom';
import './products.css';

// items: [{ label: 'Home', to: '/' }, ...]
export default function Breadcrumbs({ items = [] }) {
  if (!items || items.length === 0) return null;
  return (
    <nav aria-label="breadcrumb" className="mb-3">
      <ol className="breadcrumb m-0">
        {items.map((it, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className={`breadcrumb-item ${isLast ? 'active' : ''}`} aria-current={isLast ? 'page' : undefined}>
              {isLast || !it.to ? (
                <span>{it.label}</span>
              ) : (
                <Link to={it.to}>{it.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
