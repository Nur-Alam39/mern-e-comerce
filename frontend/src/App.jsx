import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Provide a small safe wrapper for ReactDOM.findDOMNode so libraries that
// still call it with a DOM node don't trigger the deprecation warning.
// This returns the element directly when a DOM node is passed and falls
// back to the original implementation otherwise.
import ReactDOM from 'react-dom';
if (ReactDOM && typeof ReactDOM.findDOMNode === 'function') {
  const _origFindDOMNode = ReactDOM.findDOMNode.bind(ReactDOM);
  ReactDOM.findDOMNode = (componentOrElement) => {
    try {
      if (componentOrElement && typeof componentOrElement.nodeType === 'number') return componentOrElement;
    } catch (e) { /* ignore and fallback */ }
    return _origFindDOMNode(componentOrElement);
  };
}

import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AdminDashboard from './admin/AdminDashboard';
import AdminCategoryCreate from './admin/AdminCategoryCreate';
import AdminProductEdit from './admin/AdminProductEdit';
import AdminSliders from './admin/AdminSliders';
import AdminSliderEdit from './admin/AdminSliderEdit';
import AdminOrderDetail from './admin/AdminOrderDetail';
import AdminProductVariations from './admin/AdminProductVariations';
import AdminPageEdit from './admin/AdminPageEdit';
import NavBar from './components/NavBar';
import FacebookPixel from './components/FacebookPixel';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import UserProfile from './pages/UserProfile';
import UserOrderDetail from './pages/UserOrderDetail';
import Page from './pages/Page';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
           <FacebookPixel />
           <NavBar />
           <Routes>
            <Route path="/admin" element={<div className="container-fluid mt-4"><AdminDashboard /></div>} />
            <Route path="/admin/categories/create" element={<div className="container-fluid mt-4"><AdminCategoryCreate /></div>} />
            <Route path="/admin/categories/edit/:id" element={<div className="container-fluid mt-4"><AdminCategoryCreate /></div>} />
            <Route path="/admin/products/create" element={<div className="container-fluid mt-4"><AdminProductEdit /></div>} />
            <Route path="/admin/products/edit/:id" element={<div className="container-fluid mt-4"><AdminProductEdit /></div>} />
            <Route path="/admin/products/:productId/variations" element={<div className="container-fluid mt-4"><AdminProductVariations /></div>} />
            <Route path="/admin/sliders" element={<div className="container-fluid mt-4"><AdminSliders /></div>} />
            <Route path="/admin/sliders/create" element={<div className="container-fluid mt-4"><AdminSliderEdit /></div>} />
            <Route path="/admin/sliders/edit/:id" element={<div className="container-fluid mt-4"><AdminSliderEdit /></div>} />
            <Route path="/admin/orders/:id" element={<div className="container-fluid mt-4"><AdminOrderDetail /></div>} />
            <Route path="/admin/pages/create" element={<div className="container-fluid mt-4"><AdminPageEdit /></div>} />
            <Route path="/admin/pages/edit/:id" element={<div className="container-fluid mt-4"><AdminPageEdit /></div>} />

            <Route path="/" element={<div className=""><Home /></div>} />
            <Route path="/products" element={<div className="container mt-4"><ProductList /></div>} />
            <Route path="/products/:id" element={<div className="container mt-4"><ProductDetail /></div>} />
            <Route path="/cart" element={<div className="container mt-4"><Cart /></div>} />
            <Route path="/checkout" element={<div className="container mt-4"><Checkout /></div>} />

            <Route path="/page/:slug" element={<div className="container mt-4"><Page /></div>} />
            <Route path="/login" element={<div className="container mt-4"><Login /></div>} />
            <Route path="/register" element={<div className="container mt-4"><Register /></div>} />
            <Route path="/profile" element={<div className="container mt-4"><UserProfile /></div>} />
            <Route path="/profile/orders/:id" element={<UserOrderDetail />} />
            <Route path="/order/:id" element={<UserOrderDetail />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
