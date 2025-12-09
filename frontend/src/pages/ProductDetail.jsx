import React, { useEffect, useState } from 'react';
import axios from '../utils/api';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../hooks/useSettings';
import Toast from '../components/Toast';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedProducts from '../components/RelatedProducts';
import RecentlyViewed from '../components/RecentlyViewed';
import DOMPurify from 'dompurify';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [variations, setVariations] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const { addToCart } = useCart();
  const { formatPrice } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      // ensure we start at top when opening a product detail
      try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) { /* ignore */ }
      try {
        const res = await axios.get('/api/products/' + id);
        setProduct(res.data);

        // record recently viewed (store array of ids, newest first)
        try {
          const key = 'recentlyViewed';
          const raw = localStorage.getItem(key);
          let arr = raw ? JSON.parse(raw) : [];
          // remove if already present
          arr = arr.filter(i => String(i) !== String(id));
          arr.unshift(id);
          // limit to 20
          arr = arr.slice(0, 20);
          localStorage.setItem(key, JSON.stringify(arr));
        } catch (e) { /* ignore localStorage errors */ }

        // Fetch variations for this product
        const varRes = await axios.get(`/api/variations/${id}`);
        const vars = Array.isArray(varRes.data) ? varRes.data : [];
        setVariations(vars);

        // Auto-select first variation if available
        if (vars.length > 0) {
          setSelectedSize(vars[0]._id);
        }
      } catch (err) {
        console.log(err);
      }
    })();
  }, [id]);

  const handleAddToCart = () => {
    if (variations.length > 0 && !selectedSize) {
      alert('Please select a size');
      return;
    }

    if (variations.length > 0) {
      const selectedVar = variations.find(v => v._id === selectedSize);
      if (!selectedVar) {
        alert('Invalid size selected');
        return;
      }
      if (selectedVar.stock < qty) {
        alert(`Only ${selectedVar.stock} in stock`);
        return;
      }
      addToCart({
        ...product,
        _id: product._id,
        size: selectedVar.size,
        price: selectedVar.price,
        variationId: selectedVar._id
      }, qty);
    } else {
      // No variations, add product directly
      if (product.stock < qty) {
        alert(`Only ${product.stock} in stock`);
        return;
      }
      addToCart(product, qty);
    }

    setToast(`${product.name} added to cart!`);
  };

  if (!product) return <div>Loading...</div>;

  return (
    <>
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: 'Home', to: '/' },
        { label: 'Shop', to: '/products' },
        ...(product.category ? [{ label: product.category.name }] : []),
        { label: product.name }
      ]} />

      <div className="row">
        {product.images && product.images.length > 1 && (
          <div style={{ width: 100, flexShrink: 0 }} className="d-none d-md-block">
            {/* Thumbnails */}
              <div className="d-flex flex-column gap-2">
                {product.images.map((img, idx) => {
                  const baseURL = require('../utils/api').default.defaults.baseURL;
                  const src = img.startsWith('http') ? img : (baseURL + (img.startsWith('/') ? img : '/' + img));
                  return (
                    <img
                      key={idx}
                      src={src}
                      className={`img-thumbnail ${selectedImage === idx ? 'border-primary' : ''}`}
                      style={{ width: '100%', height: 60, objectFit: 'cover', cursor: 'pointer' }}
                      alt=""
                      onClick={() => setSelectedImage(idx)}
                    />
                  );
                })}
              </div>
          </div>
        )}
        <div className="col-md-5">
          {/* Main Image */}
          <div className="position-relative">
            {(() => {
              const img = product.images && product.images[selectedImage] ? product.images[selectedImage] : '/placeholder.png';
              const baseURL = require('../utils/api').default.defaults.baseURL;
              const src = img === '/placeholder.png' ? img : (img.startsWith('http') ? img : (baseURL + (img.startsWith('/') ? img : '/' + img)));
              return (
                <>
                  <img src={src} className="img-fluid" alt="" style={{ cursor: 'pointer' }} onClick={() => setShowImageModal(true)} />
                  <button className="btn btn-light position-absolute" style={{ top: 10, left: 10, zIndex: 10 }} onClick={() => setShowImageModal(true)}>
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      <div className="col-md-5">
        <h4>{product.name}</h4>
      

        {variations.length > 0 ? (
          <>
            <div className="mb-3">
              {product.discountedPrice > 0 ? (
                <>
                  <h5 className='text-danger'>{variations.find(v => v._id === selectedSize) ? formatPrice(variations.find(v => v._id === selectedSize).price) : formatPrice(product.discountedPrice)}</h5>
                  <small className="text-muted text-decoration-line-through">{formatPrice(product.price)}</small>
                </>
              ) : (
                <h5>{variations.find(v => v._id === selectedSize) ? formatPrice(variations.find(v => v._id === selectedSize).price) : formatPrice(product.price)}</h5>
              )}
            </div>
            <div className="mb-4">
              <label className="form-label"><strong>Select Size:</strong></label>
              <div className="d-flex gap-2 flex-wrap">
                {variations.map(v => (
                  <button
                    key={v._id}
                    className={`btn ${selectedSize === v._id ? 'btn-dark' : 'btn-outline-secondary'}`}
                    onClick={() => setSelectedSize(v._id)}
                    disabled={v.stock === 0}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
              {selectedSize && (
                <small className="text-muted d-block mt-2">
                  Stock: {variations.find(v => v._id === selectedSize) ? variations.find(v => v._id === selectedSize).stock : 0}
                </small>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mb-2">
              {product.discountedPrice > 0 ? (
                <>
                  <h3 className='text-danger'>{formatPrice(product.discountedPrice)}</h3>
                  <small className="text-muted text-decoration-line-through">{formatPrice(product.price)}</small>
                </>
              ) : (
                <h3 className='text-secondary'>{formatPrice(product.price)}</h3>
              )}
            </div>
            <p>Stock: {product.stock}</p>
          </>
        )}

        <div className="mb-3">
          <label className="form-label"><strong>Quantity:</strong></label>
          <div className="input-group" style={{ width: 150 }}>
            <button
              className="btn btn-outline-secondary border"
              style={{borderRadius: 0}}
              onClick={() => setQty(Math.max(1, qty - 1))}
            >
              -
            </button>
            <input
              type="number"
              className="form-control text-center"
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              min="1"
            />
            <button
              className="btn btn-outline-secondary border"
              style={{borderRadius: 0}}
              onClick={() => setQty(qty + 1)}
            >
              +
            </button>
          </div>
        </div>

        <button
          className="btn btn-dark rounded-0"
          onClick={handleAddToCart}
          disabled={variations.length > 0 && !selectedSize}
        >
          + Add to Cart
        </button>

        {product.description && (
          <div className="mt-3">
            <button className="btn btn-link text-dark p-0" onClick={() => setShowDescription(!showDescription)}>
              {showDescription ? 'Product Description' : 'Product Description'} <i className={`fa-solid fa-chevron-${showDescription ? 'up' : 'down'}`}></i>
            </button>
            {showDescription && (
              <div className="mt-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }} />
            )}
          </div>
        )}
      </div>
    </div>

    {/* Related and Recently Viewed sections */}
    <RelatedProducts categoryId={product.category ? (product.category._id || product.category) : null} currentId={product._id} />
    <RecentlyViewed currentId={product._id} />

    {/* Image Modal */}
    {showImageModal && (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }} onClick={() => setShowImageModal(false)}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center p-0">
              {(() => {
                const img = product.images && product.images[selectedImage] ? product.images[selectedImage] : '/placeholder.png';
                const baseURL = require('../utils/api').default.defaults.baseURL;
                const src = img === '/placeholder.png' ? img : (img.startsWith('http') ? img : (baseURL + (img.startsWith('/') ? img : '/' + img)));
                return <img src={src} className="img-fluid" alt="" style={{ maxHeight: '80vh' }} />;
              })()}
            </div>
          </div>
        </div>
      </div>
    )}

    {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
