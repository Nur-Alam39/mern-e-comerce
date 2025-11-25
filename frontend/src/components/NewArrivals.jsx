import React, { useEffect, useState } from 'react';
import axios from '../utils/api';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../hooks/useSettings';
import Toast from './Toast';
import ProductCard from './ProductCard';
import './products.css';

export default function NewArrivals({ limit = 8 }) {
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const { addToCart } = useCart();
  const { formatPrice } = useSettings();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`/api/products?newArrival=true&limit=${limit}`);
        const data = res && res.data ? res.data : [];
        // API returns either an array or a paginated object { products, page, pages, total }
        const items = Array.isArray(data) ? data : (data.products || []);
        setItems(items);
      } catch (err) {
        console.log('Failed to load new arrivals', err && err.message ? err.message : err);
      }
    };
    load();
    
    // Load wishlist from localStorage
    const saved = localStorage.getItem('wishlist');
    if (saved) setWishlist(JSON.parse(saved));
  }, [limit]);

  const handleAddToCart = (product) => {
    const img = product.images && product.images[0] ? product.images[0] : '/placeholder.png';
    const src = img.startsWith('http') ? img : (img.startsWith('/') ? (require('../utils/api').default.defaults.baseURL + img) : img);
    addToCart({
      product: product._id,
      name: product.name,
      price: product.price,
      qty: 1,
      image: src
    });
    setToast(`${product.name} added to cart!`);
  };

  const toggleWishlist = (productId) => {
    const updated = wishlist.includes(productId)
      ? wishlist.filter(id => id !== productId)
      : [...wishlist, productId];
    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
  };

  if (!items || items.length === 0) return null;

  return (
      <section className="container py-4">
        <div className="d-flex align-items-center justify-content-between">
          <h3 className="mb-3">New Arrivals</h3>
          <Link to="/products?newArrival=true" className="text-dark text-decoration-none">
            View All &nbsp;
            <small><i className="fa fa-chevron-right"></i></small>
          </Link>
        </div>
        <div className="row">
          {items.map(p => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
        {toast && <Toast message={toast} onClose={() => setToast(null)}/>}
      </section>
  );
}
