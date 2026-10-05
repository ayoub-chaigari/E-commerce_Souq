// MyOrders.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/services';
import { formatPrice, formatDate, statusClass, statusLabel } from '../../utils/helpers';
import { Pagination, EmptyState } from '../../components/common';
import { FiPackage, FiEye } from 'react-icons/fi';

export function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal]   = useState(0);
  const [pages, setPages]   = useState(1);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    orderService.getMyOrders({ page, limit: 8 }).then(r => {
      setOrders(r.data.data); setTotal(r.data.total); setPages(r.data.totalPages);
    }).finally(() => setLoading(false));
  }, [page]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-muted)' }}>Chargement…</div>;
  if (!orders.length) return <EmptyState icon={<FiPackage />} title="Aucune commande" description="Vous n'avez pas encore passé de commande." action={<Link to="/products" className="btn btn-primary">Commencer mes achats</Link>} />;

  return (
    <div>
      {orders.map(o => (
        <div key={o._id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 14, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{o.orderNumber}</span>
              <span className={`badge ${statusClass(o.status)}`}>{statusLabel(o.status)}</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{formatDate(o.createdAt)} · {o.items.length} article{o.items.length > 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: -8 }}>
            {o.items.slice(0, 3).map(item => (
              <img key={item._id} src={item.image} alt={item.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '2px solid var(--white)', marginLeft: -8 }} />
            ))}
          </div>
          <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '1.05rem', minWidth: 100, textAlign: 'right' }}>{formatPrice(o.pricing.total)}</span>
          <Link to={`/account/orders/${o._id}`} className="btn btn-outline btn-sm"><FiEye size={14} /> Détails</Link>
        </div>
      ))}
      <Pagination page={page} totalPages={pages} onPageChange={setPage} />
    </div>
  );
}

export default MyOrders;
