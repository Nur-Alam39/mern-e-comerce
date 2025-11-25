import React, { useState, useEffect, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../hooks/useSettings';
import './products.css';

const ProductCard = forwardRef(({ product, showWishlist = true, showAddToCart = false, className = 'col-6 col-md-3 mb-3' }, ref) => {
  const [wishlist, setWishlist] = useState([]);
  const { addToCart } = useCart();
  const { formatPrice } = useSettings();

  useEffect(() => {
    const saved = localStorage.getItem('wishlist');
    if (saved) setWishlist(JSON.parse(saved));
  }, []);

  const handleAddToCart = (e) => {
    e.preventDefault();
    const img = product.images && product.images[0] ? product.images[0] : '/placeholder.png';
    const baseURL = require('../utils/api').default.defaults.baseURL;
    const src = img.startsWith('http') ? img : (baseURL + (img.startsWith('/') ? img : '/' + img));
    addToCart({
      product: product._id,
      name: product.name,
      price: product.discountedPrice > 0 ? product.discountedPrice : product.price,
      qty: 1,
      image: src
    });
  };

  const toggleWishlist = (e) => {
    e.preventDefault();
    const updated = wishlist.includes(product._id)
      ? wishlist.filter(id => id !== product._id)
      : [...wishlist, product._id];
    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
  };

  const img = product.images && product.images[0] ? product.images[0] : '/placeholder.png';
  const baseURL = require('../utils/api').default.defaults.baseURL;
  const src = img.startsWith('http') ? img : (baseURL + (img.startsWith('/') ? img : '/' + img));

  return (
    <div ref={ref} className={className}>
      <div className="card h-100 product-card">
        <div className="card-img-wrapper">
          <Link to={`/products/${product._id}`} className="card-img-link">
            <img src={src} className="card-img-top" alt={product.name} />
          </Link>
          {showWishlist && (
            <button
              className={`card-wishlist-btn ${wishlist.includes(product._id) ? 'active' : ''}`}
              onClick={toggleWishlist}
              title="Add to wishlist"
            >
              ♡
            </button>
          )}
        </div>
        <div className="card-body">
          <Link to={`/products/${product._id}`} className="card-title-link">
            <h6 className="card-title">{product.name}</h6>
          </Link>
          <p className="card-text">
            {product.discountedPrice > 0 ? (
              <>
                <span className="text-danger">{formatPrice(product.discountedPrice)}</span>
                <small className="text-muted text-decoration-line-through ms-2">{formatPrice(product.price)}</small>
              </>
            ) : (
              formatPrice(product.price)
            )}
          </p>
          {showAddToCart && (
            <button className="btn btn-sm btn-outline-primary w-100" onClick={handleAddToCart}>
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;