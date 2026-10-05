import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import {
  FiGrid, FiPackage, FiShoppingBag, FiUsers, FiTag,
  FiStar, FiZap, FiLogOut, FiSettings, FiBarChart2, FiCreditCard,
} from 'react-icons/fi';
import './Sidebar.css';

const vendorLinks = [
  { to: '/vendor',           label: 'Tableau de bord', icon: FiGrid,      exact: true },
  { to: '/vendor/products',  label: 'Mes produits',    icon: FiPackage },
  { to: '/vendor/orders',    label: 'Commandes',       icon: FiShoppingBag },
  { to: '/vendor/ai',        label: 'Assistant IA',    icon: FiZap },
  { to: '/account/profile',  label: 'Paramètres',      icon: FiSettings },
];

const adminLinks = [
  { to: '/admin',            label: 'Tableau de bord', icon: FiGrid,      exact: true },
  { to: '/admin/users',      label: 'Utilisateurs',    icon: FiUsers },
  { to: '/admin/vendors',    label: 'Vendeurs',        icon: FiBarChart2 },
  { to: '/admin/products',   label: 'Produits',        icon: FiPackage },
  { to: '/admin/orders',     label: 'Commandes',       icon: FiShoppingBag },
  { to: '/admin/payments',   label: 'Paiements',       icon: FiCreditCard },
  { to: '/admin/categories', label: 'Catégories',      icon: FiTag },
];

export default function Sidebar({ role = 'vendor' }) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user }  = useSelector(s => s.auth);
  const links     = role === 'admin' ? adminLinks : vendorLinks;

  const handleLogout = () => { dispatch(logout()); navigate('/'); };

  return (
    <aside className="dashboard-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">S</div>
        <div>
          <p className="sidebar-logo-text">Souq</p>
          <p className="sidebar-role">{role === 'admin' ? 'Administration' : 'Espace Vendeur'}</p>
        </div>
      </div>

      {/* User info */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">{user?.name}</p>
          <p className="sidebar-user-email">{user?.email}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {links.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <NavLink to="/" className="sidebar-link sidebar-link-ghost">
          <FiShoppingBag size={17} />
          <span>Voir la boutique</span>
        </NavLink>
        <button className="sidebar-link sidebar-logout" onClick={handleLogout}>
          <FiLogOut size={17} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
