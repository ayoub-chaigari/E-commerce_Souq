import { createSlice } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';

const stored = localStorage.getItem('cart');

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: stored ? JSON.parse(stored) : [],
  },
  reducers: {
    addToCart(state, { payload }) {
      const existing = state.items.find(i => i.product === payload.product);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + (payload.quantity || 1), payload.stock);
        toast.success('Quantité mise à jour');
      } else {
        state.items.push({ ...payload, quantity: payload.quantity || 1 });
        toast.success('Ajouté au panier');
      }
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    removeFromCart(state, { payload }) {
      state.items = state.items.filter(i => i.product !== payload);
      localStorage.setItem('cart', JSON.stringify(state.items));
      toast.success('Retiré du panier');
    },
    updateQuantity(state, { payload: { product, quantity } }) {
      const item = state.items.find(i => i.product === product);
      if (item) item.quantity = quantity;
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    clearCart(state) {
      state.items = [];
      localStorage.removeItem('cart');
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export const selectCartCount = state => state.cart.items.reduce((s, i) => s + i.quantity, 0);
export const selectCartTotal = state => state.cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
export default cartSlice.reducer;
