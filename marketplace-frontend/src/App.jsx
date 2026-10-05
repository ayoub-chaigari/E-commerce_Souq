import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMe } from './features/auth/authSlice';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { ProtectedRoute, GuestRoute } from './components/common/ProtectedRoute';

// Public pages
import HomePage        from './pages/HomePage';
import ProductsPage    from './pages/ProductsPage';
import ProductDetail   from './pages/ProductDetail';
import CartPage        from './pages/CartPage';
import CheckoutPage    from './pages/CheckoutPage';

// Auth pages
import LoginPage       from './pages/auth/LoginPage';
import RegisterPage    from './pages/auth/RegisterPage';

// Buyer account pages
import AccountLayout   from './pages/buyer/AccountLayout';
import MyOrders        from './pages/buyer/MyOrders';
import OrderDetail     from './pages/buyer/OrderDetail';
import Favorites       from './pages/buyer/Favorites';
import Profile         from './pages/buyer/Profile';

// Vendor pages
import VendorLayout    from './pages/vendor/VendorLayout';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProducts  from './pages/vendor/VendorProducts';
import VendorOrders    from './pages/vendor/VendorOrders';
import VendorAI        from './pages/vendor/VendorAI';
import ProductForm     from './pages/vendor/ProductForm';

// Admin pages
import AdminLayout     from './pages/admin/AdminLayout';
import AdminDashboard  from './pages/admin/AdminDashboard';
import AdminUsers      from './pages/admin/AdminUsers';
import AdminVendors    from './pages/admin/AdminVendors';
import AdminOrders     from './pages/admin/AdminOrders';
import AdminCategories from './pages/admin/AdminCategories';
import AdminProducts   from './pages/admin/AdminProducts';
import AdminPayments   from './pages/admin/AdminPayments';

function PublicLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const { token } = useSelector(s => s.auth);

  useEffect(() => {
    if (token) dispatch(getMe());
  }, [dispatch, token]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
        <Route path="/products" element={<PublicLayout><ProductsPage /></PublicLayout>} />
        <Route path="/products/:id" element={<PublicLayout><ProductDetail /></PublicLayout>} />
        <Route path="/cart" element={<PublicLayout><CartPage /></PublicLayout>} />

        {/* Auth */}
        <Route path="/login"    element={<GuestRoute><PublicLayout><LoginPage /></PublicLayout></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><PublicLayout><RegisterPage /></PublicLayout></GuestRoute>} />

        {/* Checkout */}
        <Route path="/checkout" element={<ProtectedRoute roles={['buyer']}><PublicLayout><CheckoutPage /></PublicLayout></ProtectedRoute>} />

        {/* Buyer account */}
        <Route path="/account" element={<ProtectedRoute roles={['buyer']}><PublicLayout><AccountLayout /></PublicLayout></ProtectedRoute>}>
          <Route path="orders"      element={<MyOrders />} />
          <Route path="orders/:id"  element={<OrderDetail />} />
          <Route path="favorites"   element={<Favorites />} />
          <Route path="profile"     element={<Profile />} />
        </Route>

        {/* Vendor */}
        <Route path="/vendor" element={<ProtectedRoute roles={['vendor']}><VendorLayout /></ProtectedRoute>}>
          <Route index              element={<VendorDashboard />} />
          <Route path="products"    element={<VendorProducts />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          <Route path="orders"      element={<VendorOrders />} />
          <Route path="ai"          element={<VendorAI />} />
        </Route>
        <Route path="/account/profile" element={<ProtectedRoute roles={['vendor', 'buyer']}><PublicLayout><Profile /></PublicLayout></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route index                element={<AdminDashboard />} />
          <Route path="users"         element={<AdminUsers />} />
          <Route path="vendors"       element={<AdminVendors />} />
          <Route path="orders"        element={<AdminOrders />} />
          <Route path="payments"      element={<AdminPayments />} />
          <Route path="categories"    element={<AdminCategories />} />
          <Route path="products"      element={<AdminProducts />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={
          <PublicLayout>
            <div style={{ textAlign: 'center', padding: '120px 24px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '6rem', color: 'var(--surface-3)' }}>404</h1>
              <p style={{ color: 'var(--ink-muted)', marginBottom: 24 }}>Page introuvable</p>
              <a href="/" className="btn btn-primary">Retour à l'accueil</a>
            </div>
          </PublicLayout>
        } />
      </Routes>
    </BrowserRouter>
  );
}
