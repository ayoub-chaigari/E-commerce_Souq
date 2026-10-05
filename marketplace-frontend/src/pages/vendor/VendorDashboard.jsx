import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { vendorService } from '../../services/services';
import { StatCard, PageHeader } from '../../components/common';
import { formatPrice, formatDate, statusClass, statusLabel } from '../../utils/helpers';
import { FiPackage, FiShoppingBag, FiDollarSign, FiAlertTriangle, FiPlus, FiTrendingUp } from 'react-icons/fi';

export default function VendorDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    vendorService.getDashboard().then(r => setData(r.data)).finally(() => setLoad(false));
  }, []);

  if (loading) return (
    <div>
      <div style={{ height: 48, background: 'var(--surface-2)', borderRadius: 12, marginBottom: 32, width: 300 }} className="skeleton" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
      </div>
    </div>
  );

  const { stats, recentOrders, lowStockProducts, topProducts } = data;

  return (
    <div>
      <PageHeader label="Espace Vendeur" title="Tableau de bord"
        action={<Link to="/vendor/products/new" className="btn btn-gold"><FiPlus size={16} /> Nouveau produit</Link>} />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 32 }}>
        <StatCard label="Produits actifs" value={stats.products.active} icon={<FiPackage size={18} />} color="var(--gold)" sub={`${stats.products.total} au total`} />
        <StatCard label="Commandes" value={stats.orders.total} icon={<FiShoppingBag size={18} />} color="var(--sky)" sub={`${stats.orders.byStatus?.pending || 0} en attente`} />
        <StatCard label="Chiffre d'affaires" value={formatPrice(stats.revenue)} icon={<FiDollarSign size={18} />} color="var(--emerald)" sub="Commandes livrées" />
        <StatCard label="Unités vendues" value={stats.unitsSold || 0} icon={<FiTrendingUp size={18} />} color="var(--crimson)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Recent orders */}
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>Commandes récentes</h3>
            <Link to="/vendor/orders" style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>Voir tout →</Link>
          </div>
          {recentOrders?.length === 0 ? <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>Aucune commande pour l'instant.</p> :
            recentOrders?.map(o => (
              <div key={o._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--surface-2)', gap: 12 }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>{o.orderNumber}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>{o.buyer?.name} · {formatDate(o.createdAt)}</p>
                </div>
                <span className={`badge ${statusClass(o.status)}`}>{statusLabel(o.status)}</span>
              </div>
            ))
          }
        </div>

        {/* Low stock + Top products */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {lowStockProducts?.length > 0 && (
            <div style={{ background: '#fef3c7', borderRadius: 'var(--radius-lg)', padding: 20, border: '1px solid #fde68a' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, color: '#92400e' }}>
                <FiAlertTriangle size={16} /> Stock faible
              </h3>
              {lowStockProducts.map(p => (
                <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem', color: '#92400e' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.name}</span>
                  <strong style={{ marginLeft: 8, flexShrink: 0 }}>{p.stock} restant{p.stock > 1 ? 's' : ''}</strong>
                </div>
              ))}
            </div>
          )}
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 20, flex: 1 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: 14 }}>Top produits</h3>
            {topProducts?.length === 0 ? <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>Pas encore de ventes.</p> :
              topProducts?.map((p, i) => (
                <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--surface-2)' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? 'var(--gold)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', flexShrink: 0 }}>{p.totalSold} vte{p.totalSold > 1 ? 's' : ''}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
