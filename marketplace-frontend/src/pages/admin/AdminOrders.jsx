import React, { useEffect, useState } from 'react';
import { orderService } from '../../services/services';
import { PageHeader, Pagination } from '../../components/common';
import { formatPrice, formatDate, statusClass, statusLabel } from '../../utils/helpers';
import { Modal } from '../../components/common';
import toast from 'react-hot-toast';
import { FiEye } from 'react-icons/fi';

const NEXT_STATUSES = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipped'],
  shipped:   ['delivered'],
  delivered: [], cancelled: [],
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [pages, setPages]   = useState(1);
  const [page, setPage]     = useState(1);
  const [total, setTotal]   = useState(0);
  const [status, setStatus] = useState('');
  const [loading, setLoad]  = useState(true);
  const [selected, setSel]  = useState(null);
  const [updating, setUpd]  = useState(false);

  const load = async () => {
    setLoad(true);
    try {
      const r = await orderService.getAll({ page, limit: 15, status: status || undefined });
      setOrders(r.data.data); setPages(r.data.totalPages); setTotal(r.data.total);
    } finally { setLoad(false); }
  };

  useEffect(() => { load(); }, [page, status]);

  const updateStatus = async (orderId, newStatus) => {
    setUpd(true);
    try {
      await orderService.updateStatus(orderId, { status: newStatus });
      toast.success('Statut mis à jour');
      load(); setSel(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setUpd(false); }
  };

  return (
    <div>
      <PageHeader label="Administration" title="Toutes les commandes" subtitle={`${total} commande${total !== 1 ? 's' : ''}`} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', 'pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-outline'}`}>
            {s ? statusLabel(s) : 'Toutes'}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--surface-3)' }}>
              {['Commande', 'Client', 'Articles', 'Total', 'Date', 'Statut', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <tr key={i}><td colSpan={7} style={{ padding: 12 }}><div className="skeleton" style={{ height: 20 }} /></td></tr>)
              : orders.map(o => (
                  <tr key={o._id} style={{ borderBottom: '1px solid var(--surface-2)' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--surface)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '13px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>{o.orderNumber}</td>
                    <td style={{ padding: '13px 16px', fontSize: '0.875rem' }}>{o.buyer?.name || '—'}</td>
                    <td style={{ padding: '13px 16px', fontSize: '0.875rem', color: 'var(--ink-muted)' }}>{o.items?.length}</td>
                    <td style={{ padding: '13px 16px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{formatPrice(o.pricing?.total)}</td>
                    <td style={{ padding: '13px 16px', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{formatDate(o.createdAt)}</td>
                    <td style={{ padding: '13px 16px' }}><span className={`badge ${statusClass(o.status)}`}>{statusLabel(o.status)}</span></td>
                    <td style={{ padding: '13px 16px' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setSel(o)}><FiEye size={13} /></button>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={pages} onPageChange={setPage} />

      <Modal isOpen={!!selected} onClose={() => setSel(null)} title={`Commande ${selected?.orderNumber}`}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className={`badge ${statusClass(selected.status)}`} style={{ padding: '6px 14px' }}>{statusLabel(selected.status)}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{selected.buyer?.name} · {selected.buyer?.email}</span>
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 14, fontSize: '0.85rem' }}>
              <p><strong>Livraison :</strong> {selected.shippingAddress?.fullName}, {selected.shippingAddress?.street}, {selected.shippingAddress?.city}</p>
              <p><strong>Tel :</strong> {selected.shippingAddress?.phone}</p>
            </div>
            {NEXT_STATUSES[selected.status]?.length > 0 && (
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Changer le statut</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {NEXT_STATUSES[selected.status].map(s => (
                    <button key={s} disabled={updating} onClick={() => updateStatus(selected._id, s)}
                      className={`btn btn-sm ${s === 'cancelled' ? 'btn-danger' : 'btn-success'}`}>
                      {updating ? '…' : statusLabel(s)}
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
