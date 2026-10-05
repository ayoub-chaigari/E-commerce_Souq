import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { selectCartCount } from '../../features/cart/cartSlice';
import {
  FiSearch, FiShoppingBag, FiUser, FiMenu, FiX,
  FiLogOut, FiPackage, FiHeart, FiSettings, FiGrid,
} from 'react-icons/fi';
import './Navbar.css';

export default function Navbar() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useSelector(s => s.auth);
  const cartCount  = useSelector(selectCartCount);
  const [search, setSearch]   = useState('');
  const [menuOpen, setMenu]   = useState(false);
  const [dropOpen, setDrop]   = useState(false);
  const dropRef = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDrop(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setDrop(false);
  };

  const dashboardLink = () => {
    if (user?.role === 'admin')  return '/admin';
    if (user?.role === 'vendor') return '/vendor';
    return '/account';
  };

  const isDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/vendor');

  if (isDashboard) return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-mark">S</span>
          <span className="logo-text">Souq</span>
        </Link>

        {/* Search */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un produit…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
        </form>

        {/* Desktop actions */}
        <div className="navbar-actions">
          <Link to="/products" className="nav-link">Boutique</Link>

          {/* Cart */}
          <Link to="/cart" className="nav-icon-btn">
            <FiShoppingBag size={20} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          {/* Favorites */}
          {user?.role === 'buyer' && (
            <Link to="/account/favorites" className="nav-icon-btn">
              <FiHeart size={20} />
            </Link>
          )}

          {/* User menu */}
          {user ? (
            <div className="user-menu" ref={dropRef}>
              <button className="user-trigger" onClick={() => setDrop(v => !v)}>
                <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                <span className="user-name">{user.name.split(' ')[0]}</span>
              </button>
              {dropOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <p className="dropdown-name">{user.name}</p>
                    <p className="dropdown-role">{user.email}</p>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to={dashboardLink()} className="dropdown-item" onClick={() => setDrop(false)}>
                    <FiGrid size={15} /> Tableau de bord
                  </Link>
                  {user.role === 'buyer' && (
                    <>
                      <Link to="/account/orders" className="dropdown-item" onClick={() => setDrop(false)}>
                        <FiPackage size={15} /> Mes commandes
                      </Link>
                      <Link to="/account/favorites" className="dropdown-item" onClick={() => setDrop(false)}>
                        <FiHeart size={15} /> Favoris
                      </Link>
                    </>
                  )}
                  <Link to="/account/profile" className="dropdown-item" onClick={() => setDrop(false)}>
                    <FiSettings size={15} /> Paramètres
                  </Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                    <FiLogOut size={15} /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="btn btn-ghost btn-sm">Connexion</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Inscription</Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button className="mobile-menu-btn" onClick={() => setMenu(v => !v)}>
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <form className="mobile-search" onSubmit={handleSearch}>
            <FiSearch />
            <input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
          </form>
          <Link to="/products" onClick={() => setMenu(false)}>Boutique</Link>
          <Link to="/cart" onClick={() => setMenu(false)}>Panier {cartCount > 0 && `(${cartCount})`}</Link>
          {user ? (
            <>
              <Link to={dashboardLink()} onClick={() => setMenu(false)}>Tableau de bord</Link>
              <button onClick={handleLogout}>Déconnexion</button>
            </>
          ) : (
            <>
              <Link to="/login"    onClick={() => setMenu(false)}>Connexion</Link>
              <Link to="/register" onClick={() => setMenu(false)}>Inscription</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
