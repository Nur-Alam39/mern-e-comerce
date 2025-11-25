import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminProducts from './AdminProducts';
import AdminCategories from './AdminCategories';
import AdminOrders from './AdminOrders';
import AdminCustomers from './AdminCustomers';
import AdminSliders from './AdminSliders';
import AdminSettings from './AdminSettings';
import AdminPayments from './AdminPayments';
import AdminCouriers from './AdminCouriers';
import AdminPages from './AdminPages';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const [active, setActive] = useState('products');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!user.isAdmin) {
      // non-admins should not access admin area
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const sec = searchParams.get('section');
    if (sec) setActive(sec);
  }, [searchParams]);

  const renderContent = () => {
    switch (active) {
      case 'products': return <AdminProducts />;
      case 'categories': return <AdminCategories />;
      case 'orders': return <AdminOrders />;
      case 'customers': return <AdminCustomers />;
      case 'pages': return <AdminPages />;
      case 'sliders': return <AdminSliders />;
      case 'settings': return <AdminSettings />;
      case 'payments': return <AdminPayments />;
      case 'couriers': return <AdminCouriers />;
      default: return <AdminProducts />;
    }
  };

  return (
    <div>
      <div className="row">
        <div className="col-md-3 mb-3">
          <AdminSidebar active={active} onChange={setActive} />
        </div>
        <div className="col-md-9">
          {renderContent()}
        </div>
      </div>
    </div>

  );
}
