import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';

export default function AdminLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" />
      <main className="dashboard-main">
        <div className="dashboard-content page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
