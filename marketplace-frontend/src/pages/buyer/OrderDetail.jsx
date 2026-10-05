import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService, deliveryService, paymentService } from '../../services/services';
import { formatPrice, formatDate, statusClass, statusLabel, deliveryStatusLabel } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiTruck, FiMapPin, FiPackage, FiCreditCard, FiExternalLink } from 'react-icons/fi';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder]       = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    orderService.getOrder(id).then(r => {
      setOrder(r.data.order);
      if (r.data.order.delivery) {
        deliveryService.getByOrder(id).then(d => setDelivery(d.data.delivery)).catch(() => {});
      }
      if (r.data.order.paymentMethod === 'stripe') {
        paymentService.getStatus(id).then(p => setPaymentInfo(p.data)).catch(() => {});
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Annuler cette commande ?')) return;
    setCancelling(true);
    try {
      const r = await orderService.cancel(id, 'Annulation par l\'acheteur');
      setOrder(r.data.order);
      toast.success('Commande annulée');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible d\'annuler');
    } finally { setCancelling(false); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-muted)' }}>Chargement…</div>;
  if (!order) return <div>Commande introuvable</div>;

  return (
    <div>
      <Link to="/account/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-muted)', marginBottom: 24, fontSize: '0.875rem' }}>
        <FiArrowLeft size={14} /> Retour aux commandes
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>Commande {order.orderNumber}</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: 4 }}>Passée le {formatDate(order.createdAt)}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={`badge ${statusClass(order.status)}`} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>{statusLabel(order.status)}</span>
          {['pending', 'confirmed'].includes(order.status) && (
            <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? '…' : 'Annuler'}
            </button>
          )}
          {order.paymentMethod === 'stripe' && order.paymentStatus === 'paid' && ['pending','confirmed'].includes(order.status) && (
            <button className="btn btn-sm" style={{ border: '1.5px solid #bfdbfe', color: '#1e40af', background: '#dbeafe' }}
              onClick={async () => {
                if (!window.confirm('Demander un remboursement Stripe pour cette commande ?')) return;
                try {
                  await paymentService.refund(order._id, { reason: 'requested_by_customer' });
                  toast.success('Remboursement effectué !');
                  window.location.reload();
                } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
              }}>
              ↩ Remboursement
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

        {/* Items + Delivery timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Articles */}
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 18 }}>Articles commandés</h3>
            {order.items.map(item => (
              <div key={item._id} style={{ display: 'flex', gap: 14, alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid var(--surface-2)', marginBottom: 14 }}>
                <img src={item.image} alt={item.name} style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0, background: 'var(--surface-2)' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: 2 }}>Qté: {item.quantity} × {formatPrice(item.price)}</p>
                </div>
                <span style={{ fontWeight: 700 }}>{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {/* Delivery timeline */}
          {delivery && (
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiTruck size={16} color="var(--gold)" /> Suivi de livraison
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginBottom: 18, fontFamily: 'var(--font-mono)' }}>N° {delivery.trackingNumber}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {delivery.timeline.map((event, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: 18 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === 0 ? 'var(--emerald)' : 'var(--surface-3)', flexShrink: 0, marginTop: 4 }} />
                      {i < delivery.timeline.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--surface-3)', margin: '4px 0' }} />}
                    </div>
                    <div style={{ paddingBottom: 4 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{deliveryStatusLabel(event.status)}</p>
                      {event.description && <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{event.description}</p>}
                      <p style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginTop: 2 }}>{formatDate(event.timestamp, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Shipping address */}
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiMapPin size={15} color="var(--gold)" /> Adresse de livraison
            </h3>
            {Object.entries({
              Nom:      order.shippingAddress.fullName,
              Téléphone: order.shippingAddress.phone,
              Adresse:  order.shippingAddress.street,
              Ville:    order.shippingAddress.city,
            }).map(([k, v]) => (
              <p key={k} style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginBottom: 4 }}>
                <strong style={{ color: 'var(--ink)', minWidth: 70, display: 'inline-block' }}>{k}</strong> {v}
              </p>
            ))}
          </div>

          {/* Payment info */}
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiCreditCard size={15} color="var(--gold)" /> Paiement
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-muted)' }}>Méthode</span>
                <span style={{ fontWeight: 600 }}>
                  {order.paymentMethod === 'stripe' ? '💳 Carte bancaire' : '💵 À la livraison'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-muted)' }}>Statut</span>
                <span style={{ fontWeight: 700, color: order.paymentStatus === 'paid' ? 'var(--emerald)' : order.paymentStatus === 'refunded' ? 'var(--sky)' : order.paymentStatus === 'failed' ? 'var(--crimson)' : 'var(--ink-muted)' }}>
                  {{ pending: 'En attente', awaiting_payment: 'En attente de paiement', paid: '✓ Payé', failed: '✗ Échoué', refunded: '↩ Remboursé' }[order.paymentStatus] || order.paymentStatus}
                </span>
              </div>
              {order.paidAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-muted)' }}>Payé le</span>
                  <span>{formatDate(order.paidAt)}</span>
                </div>
              )}
              {paymentInfo?.amountCharged && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-muted)' }}>Facturé</span>
                  <span style={{ fontWeight: 600 }}>{paymentInfo.amountCharged}</span>
                </div>
              )}
              {paymentInfo?.receiptUrl && (
                <a href={paymentInfo.receiptUrl} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, padding: '8px 14px', borderRadius: 8, border: '1.5px solid var(--surface-3)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)', transition: 'var(--transition)' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <FiExternalLink size={13} /> Voir le reçu Stripe
                </a>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiPackage size={15} color="var(--gold)" /> Récapitulatif
            </h3>
            {[['Sous-total', formatPrice(order.pricing.subtotal)], ['Livraison', formatPrice(order.pricing.shippingFee)], ['Total', formatPrice(order.pricing.total)]].map(([k, v], i) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < 2 ? '1px solid var(--surface-2)' : 'none', fontWeight: i === 2 ? 700 : 400, fontSize: i === 2 ? '1rem' : '0.875rem' }}>
                <span style={{ color: i === 2 ? 'var(--ink)' : 'var(--ink-muted)' }}>{k}</span>
                <span style={{ fontFamily: i === 2 ? 'var(--font-display)' : 'inherit' }}>{v}</span>
              </div>
            ))}
            <p style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--ink-muted)' }}>Paiement: à la livraison</p>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){div > div:last-child{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
