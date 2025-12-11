import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/api';
import { useSettings } from '../hooks/useSettings';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [variationCounts, setVariationCounts] = useState({});
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [newArrivalFilter, setNewArrivalFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const navigate = useNavigate();
  const { formatPrice } = useSettings();

  const fetchProducts = async (page = currentPage) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 20); // fixed limit for admin
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (newArrivalFilter) params.append('newArrival', newArrivalFilter);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (filterStatus !== 'all') {
        params.append('active', filterStatus === 'active' ? 'true' : 'false');
      }
      const query = params.toString() ? `?${params.toString()}` : '';

      const res = await axios.get(`/api/products${query}`);
      const data = res && res.data ? res.data : {};
      // handle paginated response
      const productsData = Array.isArray(data.products) ? data.products : [];
      setProducts(productsData);
      setCurrentPage(data.page || 1);
      setTotalPages(data.pages || 1);
      setTotalProducts(data.total || 0);

      // Fetch variation counts for all products
      const counts = {};
      for (const product of productsData) {
        try {
          const varRes = await axios.get(`/api/variations/${product._id}`);
          counts[product._id] = Array.isArray(varRes.data) ? varRes.data.length : 0;
        } catch (err) {
          counts[product._id] = 0;
        }
      }
      setVariationCounts(counts);
    } catch (err) { console.log('Failed to load products', err && err.message ? err.message : err); }
  };

  const fetchCategories = async () => {
    try { const res = await axios.get('/api/categories'); setCategories(Array.isArray(res.data) ? res.data : []); } catch (err) { console.log(err); }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setCurrentPage(1); // reset to page 1 when filters change
      await Promise.all([fetchProducts(1), fetchCategories()]);
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [search, categoryFilter, newArrivalFilter, minPrice, maxPrice, filterStatus]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchProducts(page);
  };

  const handleEdit = (p) => {
    navigate(`/admin/products/edit/${p._id}`);
  };

  const handleToggleActive = async (p) => {
    try {
      await axios.put(`/api/products/${p._id}`, { active: !p.active });
      await fetchProducts();
    } catch (err) {
      console.log('Failed to toggle status', err);
      alert('Failed to update product status');
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete product "${p.name}"? This action cannot be undone.`)) return;
    try {
      await axios.delete(`/api/products/${p._id}`);
      await fetchProducts();
    } catch (err) {
      console.log('Failed to delete product', err);
      const errorMessage = err.response?.data?.message || 'Delete failed';
      alert(errorMessage);
    }
  };

  // Products are now filtered on backend

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Products</h3>
        <div>
          <button className="btn btn-secondary me-2" onClick={() => { navigate('/admin/products/create'); }}> Add Product</button>
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-3">
        <div className="col-md-2">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <select
            className="form-select form-select-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <select
            className="form-select form-select-sm"
            value={newArrivalFilter}
            onChange={(e) => setNewArrivalFilter(e.target.value)}
          >
            <option value="">All Products</option>
            <option value="true">New Arrivals</option>
          </select>
        </div>
        <div className="col-md-2">
          <input
            type="number"
            className="form-control form-control-sm"
            placeholder="Min Price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <input
            type="number"
            className="form-control form-control-sm"
            placeholder="Max Price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <select className="form-select form-select-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? <p>Loading...</p> : (
        <>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Unit</th>
                  <th>Variations</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id} className={p.active ? '' : 'table-secondary'}>
                    <td>{p.name}</td>
                    <td>{p.sku || '-'}</td>
                    <td>{formatPrice(p.price)}</td>
                    <td>{p.stock}</td>
                    <td>{p.unit || 'pcs'}</td>
                    <td>
                      {variationCounts[p._id] > 0 ? (
                        <span className="badge bg-info">{variationCounts[p._id]}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>{p.category ? (p.category.name || p.category) : '-'}</td>
                    <td>
                      <span className={`badge ${p.active ? 'bg-success' : 'bg-secondary'}`}>
                        {p.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-secondary me-2 mb-2" onClick={() => handleEdit(p)}>Edit</button>
                      {/* <button className="btn btn-sm btn-info me-2 mb-2" onClick={() => navigate(`/admin/products/${p._id}/variations`)}>Variations</button> */}
                      {/* <button
                        className={`btn btn-sm ${p.active ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => handleToggleActive(p)}
                      >
                        {p.active ? 'Deactivate' : 'Activate'}
                      </button> */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {products.length === 0 && (
            <div className="alert alert-info text-center">
              No products found. <a href="#" onClick={() => navigate('/admin/products/create')}>Add your first product</a>.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Product pagination">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>Previous</button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(page)}>{page}</button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>Next</button>
                </li>
              </ul>
              <p className="text-center text-muted mt-2">Page {currentPage} of {totalPages} ({totalProducts} total products)</p>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
