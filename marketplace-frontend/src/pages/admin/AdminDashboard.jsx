import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/services';
import { StatCard, PageHeader } from '../../components/common';
import { formatPrice, formatDate, statusClass, statusLabel } from '../../utils/helpers';
import { FiUsers, FiPackage, FiShoppingBag, FiDollarSign, FiClock } from 'react-icons/fi';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    adminService.getStats().then(r => setData(r.data.stats)).finally(() => setLoad(false));
  }, []);

  if (loading) return (
    <div>
      <div className="skeleton" style={{ height: 48, width: 280, marginBottom: 32 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 32 }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
      </div>
    </div>
  );

  if (!data) return null;
  const orderStatuses = data.orders.byStatus || {};

  return (
    <div>
      <PageHeader label="Administration" title="Tableau de bord" subtitle="Vue d'ensemble de la plateforme" />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 32 }}>
        <StatCard label="Acheteurs" value={data.users.buyers} icon={<FiUsers size={18} />} color="var(--sky)" />
        <StatCard label="Vendeurs actifs" value={data.users.vendors} icon={<FiUsers size={18} />} color="var(--gold)"
          sub={`${data.users.pendingVendors} en attente`} />
        <StatCard label="Produits" value={data.products} icon={<FiPackage size={18} />} color="var(--emerald)" />
        <StatCard label="Commandes totales" value={data.orders.total} icon={<FiShoppingBag size={18} />} color="var(--crimson)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Revenue */}
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 20 }}>Chiffre d'affaires total</h3>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--ink)' }}>
            {formatPrice(data.revenue.total)}
          </p>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.8rem', marginTop: 4 }}>Commandes livrées uniquement</p>

          {/* Monthly chart (simple bars) */}
          {data.revenue.monthly?.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: 12 }}>6 derniers mois</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                {data.revenue.monthly.map((m, i) => {
                  const max = Math.max(...data.revenue.monthly.map(x => x.revenue));
                  const pct = max ? (m.revenue / max) * 100 : 0;
                  const months = ['Jan','Fév','Mar','Avr','Mai','Jui','Jul','Aoû','Sep','Oct','Nov','Déc'];
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div title={`${formatPrice(m.revenue)}`}
                        style={{ width: '100%', height: `${Math.max(pct, 4)}%`, background: 'var(--gold)', borderRadius: '4px 4px 0 0', transition: 'height 0.4s ease', minHeight: 4 }} />
                      <span style={{ fontSize: '0.62rem', color: 'var(--ink-muted)' }}>{months[m._id.month - 1]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Orders by status */}
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 20 }}>Commandes par statut</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['pending','confirmed','preparing','shipped','delivered','cancelled'].map(s => {
              const count = orderStatuses[s] || 0;
              const pct = data.orders.total ? (count / data.orders.total) * 100 : 0;
              return (
                <div key={s}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.82rem' }}>
                    <span className={`badge ${statusClass(s)}`}>{statusLabel(s)}</span>
                    <span style={{ fontWeight: 700 }}>{count}</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--gold)', borderRadius: 99, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      {data.recentOrders?.length > 0 && (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiClock size={16} color="var(--gold)" /> Commandes récentes
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-2)' }}>
                {['Commande', 'Client', 'Total', 'Date', 'Statut'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map(o => (
                <tr key={o._id} style={{ borderBottom: '1px solid var(--surface-2)' }}>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>{o.orderNumber}</td>
                  <td style={{ padding: '12px', fontSize: '0.875rem' }}>{o.buyer?.name || '—'}</td>
                  <td style={{ padding: '12px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{formatPrice(o.pricing?.total)}</td>
                  <td style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{formatDate(o.createdAt)}</td>
                  <td style={{ padding: '12px' }}><span className={`badge ${statusClass(o.status)}`}>{statusLabel(o.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
