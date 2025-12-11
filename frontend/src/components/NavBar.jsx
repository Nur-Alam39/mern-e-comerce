import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings';
import axios from '../utils/api';

export default function NavBar() {
  const location = useLocation();
  const { cart } = useCart();
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const { user, logout } = useAuth();
  const { brandName, formatPrice } = useSettings();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [cartOffcanvas, setCartOffcanvas] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/categories?showInNavbar=true');
        const cats = Array.isArray(res.data) ? res.data : [];
        setCategories(cats);

        // Fetch subcategories for each category
        const subs = {};
        for (const cat of cats) {
          try {
            const subRes = await axios.get(`/api/categories?parent=${cat._id}`);
            subs[cat._id] = Array.isArray(subRes.data) ? subRes.data : [];
          } catch (err) {
            console.log('Failed to fetch subcategories for', cat.name, err);
            subs[cat._id] = [];
          }
        }
        setSubcategories(subs);
      } catch (err) {
        console.log(err);
      }
    };
    fetchCategories();
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.position-relative')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 767px) {
            .navbar-categories {
              overflow-x: auto;
            }
          }
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: 250px;
            height: 100%;
            background: white;
            z-index: 1000;
            transform: translateX(-100%);
            transition: transform 0.3s;
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 999;
          }
        `
      }} />
      <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top border-bottom">
        <div className="w-100">
          {/* Upper part: Branding, Search, Cart, User */}
          <div className="container">
            <div className="d-flex justify-content-between align-items-center pb-2">
              <div className="d-flex align-items-center">
                <button className="btn btn-link text-dark d-lg-none p-0 me-2" onClick={() => setSidebarOpen(true)}>
                  <i className="fa fa-bars"></i>
                </button>
                <Link className="navbar-brand" to="/"><b>{brandName}</b></Link>
              </div>
              <div className="d-flex align-items-center gap-3">
                <button className="btn btn-link nav-link p-0" onClick={() => setShowSearchForm(!showSearchForm)}>
                  <i className={`fa-solid ${showSearchForm ? 'fa-times' : 'fa-search'}`}></i>
                </button>
                {showSearchForm && (
                  <form className="d-flex" onSubmit={handleSearch} style={{ maxWidth: '300px' }}>
                    <input
                      className="form-control form-control"
                      type="search"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="btn btn-outline-secondary btn-sm ms-2 border" type="submit">
                      <i className="fa-solid fa-search"></i>
                    </button>
                  </form>
                )}

                <button className="btn btn-link nav-link position-relative p-0" onClick={() => setCartOffcanvas(true)}>
                  <i className="fa fa-cart-shopping" style={{ fontSize: '1rem' }}></i>
                  {totalQty > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                      style={{ fontSize: '0.7rem' }}>
                      {totalQty}
                    </span>
                  )}
                </button>

                <div className="position-relative">
                  <button
                    className="btn btn-link nav-link p-0"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    style={{ fontSize: '1rem' }}
                  >
                    <i className="fa-regular fa-user"></i>
                  </button>

                  {showUserMenu && (
                    <div className="dropdown-menu show position-absolute end-0 mt-2" style={{ minWidth: '200px' }}>
                      {user ? (
                        <>
                          <h6 className="dropdown-header">{user.name || user.email}</h6>
                          <hr className="dropdown-divider m-0" />
                          <Link className="dropdown-item" to="/profile" onClick={() => setShowUserMenu(false)}>
                            <i className="fa fa-user me-2"></i>Profile
                          </Link>
                          {user.isAdmin && (
                            <>
                              <Link className="dropdown-item" to="/admin" onClick={() => setShowUserMenu(false)}>
                                <i className="fa fa-gauge me-2"></i>Admin Dashboard
                              </Link>
                              <hr className="dropdown-divider m-0" />
                            </>
                          )}
                          <button className="dropdown-item" onClick={handleLogout}>
                            <i className="fa-solid fa-right-from-bracket me-2"></i>Logout
                          </button>
                        </>
                      ) : (
                        <>
                          <Link className="dropdown-item" to="/login" onClick={() => setShowUserMenu(false)}>
                            <i className="fa-solid fa-right-to-bracket me-2"></i>Login
                          </Link>
                          <Link className="dropdown-item" to="/register" onClick={() => setShowUserMenu(false)}>
                            <i className="fa-solid fa-user-plus me-2"></i>Register
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="border-none border-sm-0 border-top"></div>
          {/* Lower part: Categories */}
          <div className="container d-none d-lg-flex justify-content-center align-items-center gap-3 px-3 pt-2 flex-nowrap navbar-categories">
            <Link className="nav-link" to="/products" style={{ textTransform: 'uppercase', fontSize: '0.9rem' }}>SHOP</Link>
            {categories.map(cat => {
              const subs = subcategories[cat._id] || [];
              if (subs.length > 0) {
                return (
                  <div
                    key={cat._id}
                    className="dropdown position-relative"
                    onMouseEnter={() => setHoveredCategory(cat._id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <Link
                      className="nav-link"
                      to={`/products?category=${cat.slug}`}
                      style={{ textTransform: 'uppercase', fontSize: '0.9rem' }}
                    >
                      {cat.name} <i className="fa fa-chevron-down ms-1" style={{ fontSize: '0.7rem' }}></i>
                    </Link>
                    {hoveredCategory === cat._id && (
                      <div className="dropdown-menu show position-absolute" style={{ top: '100%', left: 0, minWidth: '200px' }}>
                        <Link className="dropdown-item" to={`/products?category=${cat.slug}`}>All {cat.name}</Link>
                        <div className="dropdown-divider"></div>
                        {subs.map(sub => (
                          <Link key={sub._id} className="dropdown-item" to={`/products?category=${sub.slug}`}>
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <Link
                    key={cat._id}
                    className="nav-link"
                    to={`/products?category=${cat.slug}`}
                    style={{ textTransform: 'uppercase', fontSize: '0.9rem' }}
                  >
                    {cat.name}
                  </Link>
                );
              }
            })}
          </div>
          {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)}></div>}
          <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
              <h6 className="mb-0">Menu</h6>
              <button className="btn text-dark p-0" onClick={() => setSidebarOpen(false)}>
                <i className="fa fa-times"></i>
              </button>
            </div>
            <div className="p-3">
              <Link className="nav-link d-block" to="/products" onClick={() => setSidebarOpen(false)} style={{ textTransform: 'uppercase', fontSize: '0.9rem' }}>SHOP</Link>
              {categories.map(cat => {
                const subs = subcategories[cat._id] || [];
                return (
                  <div key={cat._id}>
                    <Link
                      className="nav-link d-block"
                      to={`/products?category=${cat.slug}`}
                      onClick={() => setSidebarOpen(false)}
                      style={{ textTransform: 'uppercase', fontSize: '0.9rem' }}
                    >
                      {cat.name}
                    </Link>
                    {subs.map(sub => (
                      <Link
                        key={sub._id}
                        className="nav-link d-block ms-3"
                        to={`/products?category=${sub.slug}`}
                        onClick={() => setSidebarOpen(false)}
                        style={{ fontSize: '0.8rem' }}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Cart Offcanvas */}
      <div className={`offcanvas offcanvas-end ${cartOffcanvas ? 'show' : ''}`} style={{ visibility: cartOffcanvas ? 'visible' : 'hidden' }}>
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Your Cart</h5>
          <button type="button" className="btn-close" onClick={() => setCartOffcanvas(false)}></button>
        </div>
        <div className="offcanvas-body">
          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              {cart.map((item, index) => (
                <div key={`${item.product || index}-${item.variationId || ''}`} className="d-flex mb-3 align-items-center">
                  {(() => {
                    const img = item.image || '/placeholder.png';
                    const src = img.startsWith('http') ? img : (img.startsWith('/') ? (require('../utils/api').default.defaults.baseURL + img) : img);
                    return <img src={src} style={{ width: 50, height: 50, objectFit: 'cover' }} alt="" className="me-3" />;
                  })()}
                  <div className="flex-grow-1">
                    <Link to={`/products/${item.product}`} className="text-black text-decoration-none" onClick={() => setCartOffcanvas(false)}>
                      <strong>{item.name}</strong>
                    </Link>
                    {item.size && <p className="mb-1 small text-muted">Size: {item.size}</p>}
                    <p className="mb-0">{formatPrice(item.price)} x {item.qty}</p>
                  </div>
                </div>
              ))}
              <hr />
              <div className="d-grid gap-2">
                <Link to="/checkout" className="btn btn-dark" onClick={() => setCartOffcanvas(false)}>Checkout</Link>
                <Link to="/cart" className="btn btn-secondary" onClick={() => setCartOffcanvas(false)}>View Details</Link>
                <Link to="/products" className="btn btn-outline-secondary" onClick={() => setCartOffcanvas(false)}>Continue Shopping</Link>
              </div>
            </>
          )}
        </div>
      </div>
      {cartOffcanvas && <div className="offcanvas-backdrop show" onClick={() => setCartOffcanvas(false)}></div>}
    </>
  );
}
