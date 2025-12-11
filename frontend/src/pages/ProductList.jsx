import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../utils/api';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../hooks/useSettings';
import Toast from '../components/Toast';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductCard from '../components/ProductCard';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [sort, setSort] = useState('');
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [inStockFilter, setInStockFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [toast, setToast] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const observer = useRef();
  const [categoryName, setCategoryName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const { addToCart } = useCart();
  const { formatPrice, productListPagination } = useSettings();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const p = Number(searchParams.get('page')) || 1;
    setPage(p);
    // sync filter UI from url params
    setSort(searchParams.get('sort') || '');
    setMinPriceFilter(searchParams.get('minPrice') || '');
    setMaxPriceFilter(searchParams.get('maxPrice') || '');
    setInStockFilter(searchParams.get('inStock') === 'true');
    setSelectedCategory(searchParams.get('category') || '');

    // Load wishlist from localStorage
    const saved = localStorage.getItem('wishlist');
    if (saved) setWishlist(JSON.parse(saved));

    // load category name if category is present in query
    const catParam = searchParams.get('category');
    if (catParam) {
      setCategoryId(catParam);
      (async () => {
        try {
          // Check if it's a valid ObjectId, if not, treat as slug
          const isObjectId = /^[a-f\d]{24}$/i.test(catParam);
          const endpoint = isObjectId ? `/api/categories/${catParam}` : `/api/categories/slug/${catParam}`;
          const res = await axios.get(endpoint);
          setCategoryName(res.data && res.data.name ? res.data.name : '');
        } catch (e) {
          setCategoryName('');
        }
      })();
    } else {
      setCategoryId('');
      setCategoryName('');
    }

    // Load categories for filter
    (async () => {
      try {
        const res = await axios.get('/api/categories');
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.log('Failed to load categories', err);
      }
    })();
  }, [searchParams]);

  // apply filters instantly when controls change (debounce price inputs)
  useEffect(() => {
    const apply = () => applyFilters({ sort: sort || '', minPrice: minPriceFilter || '', maxPrice: maxPriceFilter || '', inStock: inStockFilter ? 'true' : '', category: selectedCategory || '' });
    // debounce price inputs to avoid too many requests while typing
    const timer = setTimeout(apply, 350);
    return () => clearTimeout(timer);
  }, [sort, minPriceFilter, maxPriceFilter, inStockFilter, selectedCategory]);

  useEffect(() => {
    (async () => {
      if (productListPagination === 'infinite' && page > 1) {
        // For infinite scroll, only load when page changes and it's not the first page
        setLoadingMore(true);
        try {
          const queryParams = new URLSearchParams(Object.fromEntries(searchParams.entries()));
          queryParams.set('page', page);
          queryParams.set('limit', 12);

          const res = await axios.get(`/api/products?${queryParams.toString()}`);
          const data = res && res.data ? res.data : [];
          if (Array.isArray(data)) {
            setProducts(prev => [...prev, ...data]);
            setHasMore(data.length === 12); // Assuming 12 is the limit
          } else {
            const newProducts = Array.isArray(data.products) ? data.products : [];
            setProducts(prev => [...prev, ...newProducts]);
            setHasMore(newProducts.length === 12);
          }
        } catch (err) { console.log(err); }
        setLoadingMore(false);
      } else {
        // For numbered pagination or first load of infinite scroll
        setLoading(true);
        try {
          const queryParams = new URLSearchParams(Object.fromEntries(searchParams.entries()));
          queryParams.set('page', page);
          queryParams.set('limit', 12);

          const res = await axios.get(`/api/products?${queryParams.toString()}`);
          const data = res && res.data ? res.data : [];
          if (Array.isArray(data)) {
            setProducts(data);
            setPages(1);
            setTotal(data.length);
            setHasMore(data.length === 12);
          } else {
            setProducts(Array.isArray(data.products) ? data.products : []);
            setPages(data.pages || 1);
            setTotal(data.total || 0);
            setHasMore((data.products || []).length === 12);
          }
        } catch (err) { console.log(err); }
        setLoading(false);
      }
    })();
  }, [page, searchParams, productListPagination]);

  const goto = (p) => {
    const params = Object.fromEntries(searchParams.entries());
    params.page = p;
    setSearchParams(params);
  };

  const applyFilters = (opts = {}) => {
    // merge current searchParams with opts, clearing empty values
    const params = Object.fromEntries(searchParams.entries());
    // apply new values
    Object.keys(opts).forEach(k => {
      const v = opts[k];
      if (v === undefined || v === null || v === '') {
        delete params[k];
      } else {
        params[k] = String(v);
      }
    });
    // reset to first page when filters change
    params.page = 1;
    setSearchParams(params);
    // Reset products for infinite scroll when filters change
    if (productListPagination === 'infinite') {
      setProducts([]);
      setHasMore(true);
    }
  };

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

  const clearCategory = () => {
    const params = Object.fromEntries(searchParams.entries());
    if (params.category) delete params.category;
    params.page = 1;
    setSearchParams(params);
  };

  const clearSearch = () => {
    const params = Object.fromEntries(searchParams.entries());
    if (params.search) delete params.search;
    params.page = 1;
    setSearchParams(params);
  };

  const lastProductElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && productListPagination === 'infinite') {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, productListPagination]);

  const crumbs = [
    { label: 'Home', to: '/' },
    { label: 'Shop', to: '/products' }
  ];
  if (categoryName) crumbs.push({ label: categoryName, to: categoryId ? `/products?category=${categoryId}` : undefined });

  return (
    <div>
      <Breadcrumbs items={crumbs} />
      {categoryName && (
        <div className="mb-3">
          <span className="badge bg-light text-dark border">
            {categoryName}
            <button type="button" className="btn btn-sm btn-link p-0 ms-2" onClick={clearCategory} aria-label="Clear category">✕</button>
          </span>
        </div>
      )}
      {searchQuery && (
        <div className="mb-3">
          <span className="badge bg-light text-dark border">
            Search results for "{searchQuery}" ({total} products)
            <button type="button" className="btn btn-sm btn-link p-0 ms-2" onClick={clearSearch} aria-label="Clear search">✕</button>
          </span>
        </div>
      )}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <select className="form-select form-select-sm" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ width: 150 }}>
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
        <input type="number" className="form-control form-control-sm" style={{ width: 100 }} value={minPriceFilter} onChange={e => setMinPriceFilter(e.target.value)} placeholder="Min $" />
        <input type="number" className="form-control form-control-sm" style={{ width: 100 }} value={maxPriceFilter} onChange={e => setMaxPriceFilter(e.target.value)} placeholder="Max $" />
        <div className="form-check mb-0">
          <input className="form-check-input" type="checkbox" id="inStock" checked={inStockFilter} onChange={e => setInStockFilter(e.target.checked)} />
          <label className="form-check-label" htmlFor="inStock">
            In Stock
          </label>
        </div>
        <select className="form-select form-select-sm" style={{ width: 150 }} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="">Sort: Default</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name_asc">Name A-Z</option>
          <option value="name_desc">Name Z-A</option>
        </select>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => { setSort(''); setMinPriceFilter(''); setMaxPriceFilter(''); setInStockFilter(false); setSelectedCategory(''); applyFilters({ sort: '', minPrice: '', maxPrice: '', inStock: '', category: '' }); }}>Clear All</button>
      </div>
      {loading ? <p>Loading...</p> : (
        <>
          <div className="row">
            {products.map((p, index) => (
              <ProductCard
                key={p._id}
                product={p}
                ref={productListPagination === 'infinite' && products.length === index + 1 ? lastProductElementRef : null}
              />
            ))}
          </div>
          {products.length === 0 && categoryName && (
            <div className="alert alert-info text-center">
              No products found in category "{categoryName}".
            </div>
          )}
          {productListPagination === 'infinite' ? (
            loadingMore && <div className="text-center my-3"><div className="spinner-border spinner-border-sm" role="status"><span className="visually-hidden">Loading...</span></div></div>
          ) : (
            pages > 1 && (
              <nav className="d-flex justify-content-center">
                <ul className="pagination custom-pagination">
                  <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => goto(page - 1)}>Previous</button></li>
                  {Array.from({ length: pages }).map((_, i) => (
                    <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}><button className="page-link" onClick={() => goto(i + 1)}>{i + 1}</button></li>
                  ))}
                  <li className={`page-item ${page >= pages ? 'disabled' : ''}`}><button className="page-link" onClick={() => goto(page + 1)}>Next</button></li>
                </ul>
              </nav>
            )
          )}
        </>
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

