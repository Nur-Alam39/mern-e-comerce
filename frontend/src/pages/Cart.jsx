import React from 'react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../hooks/useSettings';
import { Link, useNavigate } from 'react-router-dom';

export default function Cart() {
  const { cart, updateQty, removeFromCart } = useCart();
  const { formatPrice } = useSettings();
  const navigate = useNavigate();
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <div>
      <h3 className="mb-2">Your Cart</h3>
      {cart.length === 0 ? <p>Your cart is empty. <Link to="/products">Shop now</Link></p> : (
        <div className="row">
          <div className="col-md-8">
            {cart.map((item, index) => (
                <div key={`${item.product || index}-${item.variationId || ''}`}
                     className="d-flex mb-3 align-items-center border-bottom pb-3">
                  {(() => {
                    const img = item.image || '/placeholder.png';
                    const src = img.startsWith('http') ? img : (img.startsWith('/') ? (require('../utils/api').default.defaults.baseURL + img) : img);
                    return <img src={src} style={{width: 80}} alt=""/>;
                  })()}
                  <div className="ms-3 flex-grow-1">
                    <Link to={`/products/${item.product}`} className="text-black">{item.name}</Link>
                    {item.size && <p className="mb-1"><small className="text-muted">Size: {item.size}</small></p>}
                    <p>{formatPrice(item.price)}</p>
                    <div className="input-group" style={{width: 140}}>
                      <button className="btn btn-outline-secondary border"
                              onClick={() => updateQty(item.product, Math.max(1, item.qty - 1), item.variationId)}>-
                      </button>
                      <input className="form-control text-center" value={item.qty}
                             onChange={(e) => updateQty(item.product, Number(e.target.value) || 1, item.variationId)}/>
                      <button className="btn btn-outline-secondary  border"
                              onClick={() => updateQty(item.product, item.qty + 1, item.variationId)}>+
                      </button>
                    </div>
                  </div>
                  <div>
                    <button className="btn btn-light" onClick={() => removeFromCart(item.product, item.variationId)}>
                      <i className="fa fa-trash"></i>
                      {/*&nbsp;*/}
                      {/*Remove*/}
                    </button>
                  </div>
                </div>
            ))}
          </div>
          <div className="col-md-4">
            <div className="card p-3">
              <h4>Summary</h4>
              <p>Subtotal: {formatPrice(subtotal)}</p>
              <button className="btn btn-dark w-100" onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
              <Link to="/products" className="btn btn-light w-100 mt-2 border">Continue Shopping</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
