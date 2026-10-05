import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export function ProtectedRoute({ children, roles }) {
  const { user } = useSelector(s => s.auth);
  const location = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export function GuestRoute({ children }) {
  const { user } = useSelector(s => s.auth);
  if (user) {
    if (user.role === 'admin')  return <Navigate to="/admin" replace />;
    if (user.role === 'vendor') return <Navigate to="/vendor" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}
