// AccountLayout.jsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiPackage, FiHeart, FiSettings } from 'react-icons/fi';

export default function AccountLayout() {
  const { user } = useSelector(s => s.auth);
  const tabs = [
    { to: '/account/orders',    label: 'Commandes',  icon: FiPackage },
    { to: '/account/favorites', label: 'Favoris',    icon: FiHeart },
    { to: '/account/profile',   label: 'Profil',     icon: FiSettings },
  ];

  return (
    <div className="page-enter" style={{ padding: '40px 0 80px' }}>
      <div className="container-sm">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>Mon compte</h1>
          <p style={{ color: 'var(--ink-muted)', marginTop: 4 }}>Bonjour, {user?.name} 👋</p>
        </div>
        <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--surface-3)', marginBottom: 32 }}>
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px',
                fontWeight: 600, fontSize: '0.875rem', color: isActive ? 'var(--ink)' : 'var(--ink-muted)',
                borderBottom: isActive ? '2px solid var(--ink)' : '2px solid transparent',
                marginBottom: -2, transition: 'var(--transition)',
              })}>
              <Icon size={15} />{label}
            </NavLink>
          ))}
        </div>
        <Outlet />
      </div>
    </div>
  );
}
