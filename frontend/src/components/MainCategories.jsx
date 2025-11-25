import React, { useEffect, useState } from 'react';
import axios from '../utils/api';
import { Link } from 'react-router-dom';
import './categories.css';

export default function MainCategories() {
  const [cats, setCats] = useState([]);
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/categories?main=true');
        const data = res && res.data ? res.data : [];
        setCats(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log('Failed to load categories', err && err.message ? err.message : err);
      }
    };
    load();
  }, []);

  if (!cats || cats.length === 0) return null;

  return (
    <section className="main-cats container py-4">
      <h3 className="mb-3 text-center">Shop By Category</h3>
      <div className="row">
        {cats.map(c => (
          <div key={c._id} className="col-4 col-md-2 mb-3">
            <Link to={`/products?category=${c._id}`} className="cat-card">
              <div className="cat-img-wrap">
                {(() => {
                  const img = c.image || '/placeholder.png';
                  const src = img.startsWith('http') ? img : (img.startsWith('/') ? (require('../utils/api').default.defaults.baseURL + img) : img);
                  return <img src={src} alt={c.name} />;
                })()}
              </div>
              <div className="cat-title">{c.name}</div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
