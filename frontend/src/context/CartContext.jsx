import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem('cart');
      return raw ? JSON.parse(raw) : [];
    } catch (err) { return []; }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      // For variations, use a combination of product ID and variation ID as unique key
      const cartItemKey = product.variationId ? `${product._id}-${product.variationId}` : product._id;

      const idx = prev.findIndex(i => {
        const itemKey = i.variationId ? `${i.product}-${i.variationId}` : i.product;
        return itemKey === cartItemKey;
      });

      if (idx > -1) {
        const copy = [...prev];
        copy[idx].qty += qty;
        return copy;
      }

      // normalize image: prefer product.image (if caller provided a normalized URL),
      // otherwise fall back to product.images[0] (and normalize relative paths)
      let imageUrl = '';
      if (product.image) {
        imageUrl = product.image;
      } else if (product.images && product.images[0]) {
        const img = product.images[0];
        imageUrl = img && img.startsWith('http') ? img : (img && img.startsWith('/') ? (require('../utils/api').default.defaults.baseURL + img) : img);
      }

      return [...prev, {
        product: product._id,
        name: product.name,
        price: product.price,
        image: imageUrl || '',
        qty,
        size: product.size || null,
        variationId: product.variationId || null
      }];
    });
  };

  const updateQty = (productId, qty, variationId = null) => setCart(prev => prev.map(i => {
    const isSameItem = variationId
      ? (i.product === productId && i.variationId === variationId)
      : (i.product === productId && !i.variationId);
    return isSameItem ? { ...i, qty } : i;
  }));

  const removeFromCart = (productId, variationId = null) => setCart(prev => prev.filter(i => {
    const isSameItem = variationId
      ? (i.product === productId && i.variationId === variationId)
      : (i.product === productId && !i.variationId);
    return !isSameItem;
  }));
  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQty, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
export default CartContext;
