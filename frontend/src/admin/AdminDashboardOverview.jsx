import React, { useEffect, useState } from 'react';
import axios from '../utils/api';

export default function AdminDashboardOverview() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.log('Failed to load stats', err);
        setError('Failed to load dashboard stats. Please ensure you are logged in as admin.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <h3>Dashboard Overview</h3>
      <div className="row">
        <div className="col-md-3 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">{stats.totalProducts || 0}</h5>
              <p className="card-text">Total Products</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">{stats.totalOrders || 0}</h5>
              <p className="card-text">Total Orders</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">{stats.totalCustomers || 0}</h5>
              <p className="card-text">Total Customers</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">{stats.totalCategories || 0}</h5>
              <p className="card-text">Total Categories</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}