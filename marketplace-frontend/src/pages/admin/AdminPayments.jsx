import React, { useEffect, useState } from 'react';
import { orderService, paymentService } from '../../services/services';
import { PageHeader, Pagination, Modal } from '../../components/common';
import { formatPrice, formatDate, statusClass, statusLabel } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiCreditCard, FiRefreshCw, FiExternalLink,
  FiAlertTriangle, FiCheckCircle, FiXCircle,
} from 'react-icons/fi';

const PAYMENT_STATUS_STYLE = {
  pending:          { color: '#92400e', bg: '#fef3c7' },
  awaiting_payment: { color: '#1e40af', bg: '#dbeafe' },
  paid:             { color: '#065f46', bg: '#d1fae5' },
  failed:           { color: '#991b1b', bg: '#fee2e2' },
  refunded:         { color: '#1e40af', bg: '#dbeafe' },
};
const PAYMENT_STATUS_LABEL = {
  pending: 'En attente', awaiting_payment: 'Attente paiement',
  paid: 'Payé', failed: 'Échoué', refunded: 'Remboursé',
};

export default function AdminPayments() {
  const [orders, setOrders]   = useState([]);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [loading, setLoad]    = useState(true);
  const [filter, setFilter]   = useState('stripe'); // 'stripe' | 'all'
  const [selected, setSelected] = useState(null);
  const [payDetail, setPayDetail] = useState(null);
  const [refunding, setRefunding] = useState(false);
  const [refundReason, setReason] = useState('requested_by_customer');

  const load = async () => {
    setLoad(true);
    try {
      const r = await orderService.getAll({ page, limit: 15 });
      const data = filter === 'stripe'
        ? { ...r.data, data: r.data.data.filter(o => o.paymentMethod === 'stripe') }
        : r.data;
      setOrders(data.data || []);
      setPages(r.data.totalPages);
      setTotal(r.data.total);
    } finally { setLoad(false); }
  };

  useEffect(() => { load(); }, [page, filter]);

  const openDetail = async (order) => {
    setSelected(order);
    setPayDetail(null);
    if (order.paymentMethod === 'stripe') {
      try {
        const r = await paymentService.getStatus(order._id);
        setPayDetail(r.data);
      } catch {}
    }
  };

  const handleRefund = async () => {
    if (!window.confirm(`Rembourser la commande ${selected.orderNumber} ?`)) return;
    setRefunding(true);
    try {
      await paymentService.refund(selected._id, { reason: refundReason });
      toast.success('Remboursement effectué avec succès');
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du remboursement');
    } finally { setRefunding(false); }
  };

  // Summary stats
  const stripeOrders  = orders.filter(o => o.paymentMethod === 'stripe');
  const paidOrders    = orders.filter(o => o.paymentStatus === 'paid');
  const refundedOrders = orders.filter(o => o.paymentStatus === 'refunded');
  const revenue       = paidOrders.reduce((s, o) => s + (o.pricing?.total || 0), 0);

  return (
    <div>
      <PageHeader label="Administration" title="Paiements Stripe"
        subtitle="Gestion des transactions et remboursements" />

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Paiements Stripe', value: stripeOrders.length, icon: <FiCreditCard size={18} />, color: '#2563eb' },
          { label: 'Transactions payées', value: paidOrders.length, icon: <FiCheckCircle size={18} />, color: 'var(--emerald)' },
          { label: 'Remboursements', value: refundedOrders.length, icon: <FiRefreshCw size={18} />, color: 'var(--sky)' },
          { label: 'Revenus (payés)', value: formatPrice(revenue), icon: <FiCreditCard size={18} />, color: 'var(--gold)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)' }}>{s.label}</span>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'stripe', label: '💳 Stripe uniquement' },
          { id: 'all',    label: '📋 Toutes les commandes' },
        ].map(f => (
          <button key={f.id} onClick={() => { setFilter(f.id); setPage(1); }}
            className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-outline'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--surface-3)' }}>
              {['Commande', 'Client', 'Total', 'Méthode', 'Statut paiement', 'Date', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} style={{ padding: 12 }}>
                    <div className="skeleton" style={{ height: 18 }} />
                  </td></tr>
                ))
              : orders.length === 0
              ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--ink-muted)' }}>Aucune transaction trouvée</td></tr>
              : orders.map(o => {
                  const ps = PAYMENT_STATUS_STYLE[o.paymentStatus] || { color: 'var(--ink-muted)', bg: 'var(--surface)' };
                  return (
                    <tr key={o._id} style={{ borderBottom: '1px solid var(--surface-2)', transition: 'background 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--surface)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '13px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>{o.orderNumber}</td>
                      <td style={{ padding: '13px 16px', fontSize: '0.875rem' }}>{o.buyer?.name || '—'}</td>
                      <td style={{ padding: '13px 16px', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>{formatPrice(o.pricing?.total)}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {o.paymentMethod === 'stripe' ? '💳 Stripe' : '💵 Livraison'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, background: ps.bg, color: ps.color }}>
                          {PAYMENT_STATUS_LABEL[o.paymentStatus] || o.paymentStatus}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{formatDate(o.paidAt || o.createdAt)}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openDetail(o)}>Détails</button>
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={pages} onPageChange={setPage} />

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Transaction — ${selected?.orderNumber}`}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Status header */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className={`badge ${statusClass(selected.status)}`} style={{ padding: '6px 14px' }}>
                {statusLabel(selected.status)}
              </span>
              {(() => {
                const ps = PAYMENT_STATUS_STYLE[selected.paymentStatus] || {};
                return (
                  <span style={{ padding: '6px 14px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 700, background: ps.bg, color: ps.color }}>
                    {PAYMENT_STATUS_LABEL[selected.paymentStatus] || selected.paymentStatus}
                  </span>
                );
              })()}
            </div>

            {/* Order summary */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.85rem' }}>
                {[
                  ['Client',   selected.buyer?.name],
                  ['Email',    selected.buyer?.email],
                  ['Méthode',  selected.paymentMethod === 'stripe' ? '💳 Carte Stripe' : '💵 À la livraison'],
                  ['Total MAD', formatPrice(selected.pricing?.total)],
                  ...(selected.paidAt ? [['Payé le', formatDate(selected.paidAt)]] : []),
                  ...(selected.refundedAt ? [['Remboursé le', formatDate(selected.refundedAt)]] : []),
                ].map(([k, v]) => v ? (
                  <div key={k}>
                    <p style={{ color: 'var(--ink-muted)', fontSize: '0.72rem', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</p>
                    <p style={{ fontWeight: 600 }}>{v}</p>
                  </div>
                ) : null)}
              </div>
            </div>

            {/* Stripe details */}
            {selected.paymentMethod === 'stripe' && (
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 16 }}>
                <p style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#2563eb' }}>
                  <FiCreditCard size={14} /> Détails Stripe
                </p>
                {payDetail === null && <p style={{ color: 'var(--ink-muted)', fontSize: '0.82rem' }}>Chargement…</p>}
                {payDetail && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem' }}>
                    {[
                      ['Montant facturé', payDetail.amountCharged],
                      ['Statut Stripe',   payDetail.stripeStatus],
                      ['Charge ID',       payDetail.chargeId],
                      ['Refund ID',       payDetail.refundId],
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--ink-muted)' }}>{k}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.78rem' }}>{v}</span>
                      </div>
                    ))}
                    {payDetail.receiptUrl && (
                      <a href={payDetail.receiptUrl} target="_blank" rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2563eb', fontWeight: 600, marginTop: 4 }}>
                        <FiExternalLink size={13} /> Voir le reçu Stripe
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Refund action */}
            {selected.paymentMethod === 'stripe' && selected.paymentStatus === 'paid' && (
              <div style={{ border: '1.5px solid #fecaca', borderRadius: 'var(--radius)', padding: 16 }}>
                <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--crimson)' }}>
                  <FiAlertTriangle size={14} /> Émettre un remboursement
                </p>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Motif</label>
                  <select className="form-input" value={refundReason} onChange={e => setReason(e.target.value)}>
                    <option value="requested_by_customer">Demande du client</option>
                    <option value="duplicate">Commande en double</option>
                    <option value="fraudulent">Fraude</option>
                  </select>
                </div>
                <button className="btn btn-danger w-full" onClick={handleRefund} disabled={refunding}>
                  {refunding
                    ? <><span className="spinner" style={{ borderTopColor: '#fff' }} /> Remboursement…</>
                    : <><FiRefreshCw size={14} /> Rembourser {formatPrice(selected.pricing?.total)}</>}
                </button>
                <p style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginTop: 8, textAlign: 'center' }}>
                  Remboursement complet via Stripe. Action irréversible.
                </p>
              </div>
            )}

            {selected.paymentStatus === 'refunded' && (
              <div style={{ background: '#dbeafe', borderRadius: 'var(--radius)', padding: 14, display: 'flex', gap: 10, alignItems: 'center', color: '#1e40af', fontSize: '0.875rem' }}>
                <FiCheckCircle size={16} />
                Cette commande a déjà été remboursée le {formatDate(selected.refundedAt)}.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
