import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/api';

export default function AdminCustomers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users/admin/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
      setCurrentPage(1);
    } catch (err) {
      console.log('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId, currentBlocked) => {
    try {
      await axios.put(`/api/users/admin/users/${userId}/block`);
      setUsers(users.map(u => u._id === userId ? { ...u, blocked: !currentBlocked } : u));
      alert(`User ${!currentBlocked ? 'blocked' : 'unblocked'} successfully`);
    } catch (err) {
      console.log('Failed to block/unblock user', err);
      alert('Failed to update user status');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));

    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Customers</h3>
      </div>

      {/* Search */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Search by Name, Email, or Phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          <small className="text-muted">Found {filteredUsers.length} user(s)</small>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : paginatedUsers.length === 0 ? (
        <div className="alert alert-info">No users found.</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Orders</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map(u => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || '-'}</td>
                    <td><small>{formatDate(u.createdAt)}</small></td>
                    <td>{u.orderCount || 0}</td>
                    <td>
                      <span className={`badge ${u.blocked ? 'bg-danger' : 'bg-success'}`}>
                        {u.blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/admin/customers/${u._id}`}
                        className="btn btn-sm btn-primary me-2"
                      >
                        View Details
                      </Link>
                      <button
                        className={`btn btn-sm ${u.blocked ? 'btn-success' : 'btn-warning'}`}
                        onClick={() => handleBlockUser(u._id, u.blocked)}
                      >
                        {u.blocked ? 'Unblock' : 'Block'}
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
                  <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                    Previous
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(page)}>
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
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