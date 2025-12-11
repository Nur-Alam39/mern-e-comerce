import React, { useEffect, useState } from 'react';
import axios from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [providers, setProviders] = useState([]);
  const navigate = useNavigate();
  const { formatPrice } = useSettings();

  useEffect(() => {
    loadOrders(1, '', '');
    loadProviders();
  }, []);

  const loadOrders = async (page = 1, search = '', status = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(search && { search }),
        ...(status && { status })
      });
      const res = await axios.get(`/api/orders?${params}`);
      const { orders: fetchedOrders, page: currentPage, pages, total } = res.data;
      setOrders(fetchedOrders || []);
      setCurrentPage(currentPage || 1);
      setTotalPages(pages || 1);
      setTotalOrders(total || 0);
    } catch (err) {
      console.log('Failed to load orders', err && err.message ? err.message : err);
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      const res = await axios.get('/api/settings');
      const cps = res.data && res.data.courierProviders ? res.data.courierProviders.filter(c => c.enabled) : [];
      setProviders(cps || []);
    } catch (err) {
      console.log('Failed to load courier providers', err);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleViewDetails = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedOrders(orders.map(o => o._id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId, checked) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedOrders.length === 0) return;
    try {
      for (const orderId of selectedOrders) {
        await axios.put(`/api/orders/${orderId}/status`, { status: newStatus });
      }
      alert('Status updated for selected orders');
      loadOrders(currentPage, searchTerm, filterStatus);
      setSelectedOrders([]);
    } catch (err) {
      console.log('Failed to update orders', err);
      alert('Failed to update some orders');
    }
  };

  const handleBulkShipment = async (provider) => {
    if (selectedOrders.length === 0 || !provider) return;
    try {
      for (const orderId of selectedOrders) {
        await axios.post('/api/couriers/create', { provider, orderId });
      }
      alert('Shipments created for selected orders');
      loadOrders(currentPage, searchTerm, filterStatus);
      setSelectedOrders([]);
    } catch (err) {
      console.log('Failed to create shipments', err);
      alert('Failed to create shipments for some orders');
    }
  };

  const handleBulkPrintInvoice = () => {
    if (selectedOrders.length === 0) return;
    selectedOrders.forEach(orderId => {
      const printWindow = window.open(`/admin/orders/${orderId}`, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    });
  };

  // Get unique statuses for filter (from current orders, but since paginated, may not be all)
  const statuses = [...new Set(orders.map(o => o.status))].sort();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Orders</h3>
      </div>

      {/* Filters and Search */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Search by Order ID, User name, or Amount..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  loadOrders(1, e.target.value, filterStatus);
                }}
              />
            </div>
            <div className="col-md-6 mb-2">
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  loadOrders(1, searchTerm, e.target.value);
                }}
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          <small className="text-muted">Found {totalOrders} order(s)</small>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="card mb-3">
          <div className="card-body">
            <h6>Bulk Actions ({selectedOrders.length} selected)</h6>
            <div className="row">
              <div className="col-md-4">
                <label>Update Status:</label>
                <div className="input-group">
                  <select className="form-select" id="bulkStatus">
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <button className="btn btn-primary" onClick={() => handleBulkStatusUpdate(document.getElementById('bulkStatus').value)}>
                    Update Status
                  </button>
                </div>
              </div>
              <div className="col-md-4">
                <label>Create Shipment:</label>
                <div className="input-group">
                  <select className="form-select" id="bulkProvider">
                    {providers.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                  </select>
                  <button className="btn btn-success" onClick={() => handleBulkShipment(document.getElementById('bulkProvider').value)}>
                    Create Shipments
                  </button>
                </div>
              </div>
              <div className="col-md-4">
                <label>Print Invoices:</label>
                <button className="btn btn-secondary" onClick={handleBulkPrintInvoice}>
                  Print Invoices
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : orders.length === 0 ? (
        <div className="alert alert-info">No orders found.</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={selectedOrders.length === orders.length && orders.length > 0} onChange={(e) => handleSelectAll(e.target.checked)} /></th>
                  <th>Date & Time</th>
                  <th>Order ID</th>
                  <th>User</th>
                  <th>Payment</th>
                  <th>Courier</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td><input type="checkbox" checked={selectedOrders.includes(o._id)} onChange={(e) => handleSelectOrder(o._id, e.target.checked)} /></td>
                    <td><small>{formatDate(o.createdAt)}</small></td>
                    <td><small>{o._id.slice(0, 8)}...</small></td>
                    <td>
                      {o.user ? (
                        <Link to={`/admin/customers/${o.user._id}`} className="text-decoration-none">
                          {o.user.name || o.user.email}
                        </Link>
                      ) : 'Guest'}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark">
                        {o.paymentMethod || 'N/A'}
                      </span>
                    </td>
                    <td>
                      {o.shipments && o.shipments.length > 0 ? (
                        <div>
                          {o.shipments.slice(0, 2).map((shipment, idx) => (
                            <div key={idx} className="mb-1">
                              <small className="text-capitalize fw-bold">{shipment.provider}</small>
                              <br />
                              <span className={`badge ${shipment.status === 'delivered' ? 'bg-success' :
                                shipment.status === 'shipped' ? 'bg-primary' :
                                  shipment.status === 'pending' ? 'bg-warning' :
                                    'bg-secondary'} small`}>
                                {shipment.status}
                              </span>
                            </div>
                          ))}
                          {o.shipments.length > 2 && (
                            <small className="text-muted">+{o.shipments.length - 2} more</small>
                          )}
                        </div>
                      ) : (
                        <span className="badge bg-secondary">No shipment</span>
                      )}
                    </td>
                    <td><strong>{formatPrice(o.totalPrice)}</strong></td>
                    <td>
                      <span className={`badge ${o.status === 'Completed' ? 'bg-success' :
                        o.status === 'Delivered' ? 'bg-info' :
                          o.status === 'Cancelled' ? 'bg-danger' :
                            o.status === 'Shipped' ? 'bg-primary' :
                              o.status === 'Processing' ? 'bg-warning' :
                                'bg-secondary'
                        }`}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-info" onClick={() => handleViewDetails(o._id)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Page navigation" className="mt-3">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => loadOrders(currentPage - 1, searchTerm, filterStatus)} disabled={currentPage === 1}>
                    Previous
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => loadOrders(page, searchTerm, filterStatus)}>
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => loadOrders(currentPage + 1, searchTerm, filterStatus)} disabled={currentPage === totalPages}>
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
