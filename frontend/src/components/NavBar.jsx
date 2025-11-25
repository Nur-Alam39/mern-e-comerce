import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings';
import axios from '../utils/api';

export default function NavBar() {
  const { cart } = useCart();
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const { user, logout } = useAuth();
  const { brandName } = useSettings();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSearchForm, setShowSearchForm] = useState(false);

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
        setCategories(Array.isArray(res.data) ? res.data : []);
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
                  <form className="d-flex" onSubmit={handleSearch} style={{maxWidth: '300px'}}>
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

                <Link className="nav-link position-relative" to="/cart">
                  <i className="fa fa-cart-shopping" style={{fontSize: '1rem'}}></i>
                  {totalQty > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                            style={{fontSize: '0.7rem'}}>
                    {totalQty}
                  </span>
                  )}
                </Link>

                <div className="position-relative">
                  <button
                      className="btn btn-link nav-link p-0"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      style={{fontSize: '1rem'}}
                  >
                    <i className="fa-regular fa-user"></i>
                  </button>

                  {showUserMenu && (
                      <div className="dropdown-menu show position-absolute end-0 mt-2" style={{minWidth: '200px'}}>
                        {user ? (
                            <>
                              <h6 className="dropdown-header">{user.name || user.email}</h6>
                              <hr className="dropdown-divider m-0"/>
                              <Link className="dropdown-item" to="/profile" onClick={() => setShowUserMenu(false)}>
                                <i className="fa fa-user me-2"></i>Profile
                              </Link>
                              {user.isAdmin && (
                                  <>
                                    <Link className="dropdown-item" to="/admin" onClick={() => setShowUserMenu(false)}>
                                      <i className="fa fa-gauge me-2"></i>Admin Dashboard
                                    </Link>
                                    <hr className="dropdown-divider m-0"/>
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
          <div className="border-none border-top"></div>
          {/* Lower part: Categories */}
          <div className="container d-none d-lg-flex justify-content-center align-items-center gap-3 px-3 pt-2 flex-nowrap navbar-categories">
            <Link className="nav-link" to="/products" style={{textTransform: 'uppercase', fontSize: '0.9rem'}}>SHOP</Link>
            {categories.map(cat => (
                <Link
                    key={cat._id}
                    className="nav-link"
                    to={`/products?category=${cat._id}`}
                    style={{textTransform: 'uppercase', fontSize: '0.9rem'}}
                >
                  {cat.name}
                </Link>
            ))}
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
              <Link className="nav-link d-block" to="/products" onClick={() => setSidebarOpen(false)} style={{textTransform: 'uppercase', fontSize: '0.9rem'}}>SHOP</Link>
              {categories.map(cat => (
                <Link
                  key={cat._id}
                  className="nav-link d-block"
                  to={`/products?category=${cat._id}`}
                  onClick={() => setSidebarOpen(false)}
                  style={{textTransform: 'uppercase', fontSize: '0.9rem'}}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
