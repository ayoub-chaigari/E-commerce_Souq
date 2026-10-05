import React, { useEffect, useState } from 'react';
import { orderService } from '../../services/services';
import { PageHeader, Pagination, EmptyState } from '../../components/common';
import { formatPrice, formatDate, statusClass, statusLabel } from '../../utils/helpers';
import { Modal } from '../../components/common';
import toast from 'react-hot-toast';
import { FiShoppingBag, FiEye } from 'react-icons/fi';

const STATUS_TRANSITIONS = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipped'],
  shipped:   ['delivered'],
  delivered: [],
  cancelled: [],
};

const STATUS_LABELS = {
  confirmed: 'Confirmer',
  preparing: 'En préparation',
  shipped:   'Expédier',
  delivered: 'Marquer livré',
  cancelled: 'Annuler',
};

export default function VendorOrders() {
  const [orders, setOrders]   = useState([]);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [loading, setLoad]    = useState(true);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoad(true);
    try {
      const r = await orderService.getVendor({ page, limit: 10 });
      setOrders(r.data.data); setPages(r.data.totalPages); setTotal(r.data.total);
    } finally { setLoad(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleStatus = async (orderId, status) => {
    setUpdating(true);
    try {
      await orderService.updateStatus(orderId, { status });
      toast.success(`Statut mis à jour : ${statusLabel(status)}`);
      load();
      setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setUpdating(false); }
  };

  if (loading) return (
    <div><PageHeader label="Vendeur" title="Commandes" />
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, marginBottom: 12 }} />)}
    </div>
  );

  return (
    <div>
      <PageHeader label="Gestion" title="Commandes" subtitle={`${total} commande${total !== 1 ? 's' : ''} au total`} />

      {orders.length === 0 ? (
        <EmptyState icon={<FiShoppingBag />} title="Aucune commande" description="Vos commandes apparaîtront ici." />
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--surface-3)' }}>
                {['Commande', 'Client', 'Articles', 'Total', 'Date', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id} style={{ borderBottom: '1px solid var(--surface-2)', transition: 'background 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>{o.orderNumber}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.875rem' }}>{o.buyer?.name || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: 'var(--ink-muted)' }}>{o.items.length} article{o.items.length > 1 ? 's' : ''}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{formatPrice(o.pricing.total)}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{formatDate(o.createdAt)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`badge ${statusClass(o.status)}`}>{statusLabel(o.status)}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setSelected(o)}>
                      <FiEye size={13} /> Gérer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={pages} onPageChange={setPage} />

      {/* Order detail modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Commande ${selected?.orderNumber}`}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={`badge ${statusClass(selected.status)}`} style={{ padding: '6px 14px' }}>{statusLabel(selected.status)}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{formatDate(selected.createdAt)}</span>
            </div>

            {/* Items */}
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10, color: 'var(--ink-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Articles</p>
              {selected.items.map(i => (
                <div key={i._id} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--surface-2)', marginBottom: 10 }}>
                  <img src={i.image} alt={i.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', background: 'var(--surface-2)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{i.name}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>× {i.quantity} · {formatPrice(i.price)}</p>
                  </div>
                  <span style={{ fontWeight: 700 }}>{formatPrice(i.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Address */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 14, fontSize: '0.85rem' }}>
              <p style={{ fontWeight: 700, marginBottom: 6 }}>Livraison</p>
              <p style={{ color: 'var(--ink-muted)' }}>{selected.shippingAddress.fullName} · {selected.shippingAddress.phone}</p>
              <p style={{ color: 'var(--ink-muted)' }}>{selected.shippingAddress.street}, {selected.shippingAddress.city}</p>
            </div>

            {/* Actions */}
            {STATUS_TRANSITIONS[selected.status]?.length > 0 && (
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10, color: 'var(--ink-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Mettre à jour le statut</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {STATUS_TRANSITIONS[selected.status].map(s => (
                    <button key={s} disabled={updating}
                      className={`btn btn-sm ${s === 'cancelled' ? 'btn-danger' : 'btn-primary'}`}
                      onClick={() => handleStatus(selected._id, s)}>
                      {updating ? '…' : STATUS_LABELS[s] || statusLabel(s)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
