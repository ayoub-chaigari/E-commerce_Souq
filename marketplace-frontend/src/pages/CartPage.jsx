import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { removeFromCart, updateQuantity, selectCartTotal } from '../features/cart/cartSlice';
import { formatPrice } from '../utils/helpers';
import { EmptyState } from '../components/common';
import { FiTrash2, FiShoppingBag, FiArrowRight } from 'react-icons/fi';

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector(s => s.cart);
  const { user }  = useSelector(s => s.auth);
  const total     = useSelector(selectCartTotal);

  const handleCheckout = () => {
    if (!user) { navigate('/login', { state: { from: { pathname: '/checkout' } } }); return; }
    navigate('/checkout');
  };

  if (items.length === 0) return (
    <div className="container page-enter" style={{ padding: '80px 24px' }}>
      <EmptyState icon="🛒" title="Votre panier est vide"
        description="Explorez notre boutique et ajoutez des produits."
        action={<Link to="/products" className="btn btn-primary">Parcourir la boutique</Link>} />
    </div>
  );

  return (
    <div className="page-enter container" style={{ padding: '40px 24px 80px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem,3vw,2rem)', marginBottom: 32 }}>
        Mon panier <span style={{ color: 'var(--ink-muted)', fontSize: '1rem', fontFamily: 'var(--font-body)' }}>({items.length} article{items.length > 1 ? 's' : ''})</span>
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map(item => (
            <div key={item.product} style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', gap: 20, alignItems: 'center' }}>
              <Link to={`/products/${item.product}`}>
                <img src={item.image} alt={item.name} style={{ width: 90, height: 90, borderRadius: 'var(--radius)', objectFit: 'cover', flexShrink: 0, background: 'var(--surface-2)' }} />
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/products/${item.product}`} style={{ fontWeight: 600, display: 'block', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</Link>
                <p style={{ color: 'var(--gold)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{formatPrice(item.price)}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--surface-3)', borderRadius: 'var(--radius-sm)' }}>
                  <button onClick={() => dispatch(updateQuantity({ product: item.product, quantity: Math.max(1, item.quantity - 1) }))} style={{ padding: '6px 12px', color: 'var(--ink-muted)' }}>−</button>
                  <span style={{ padding: '6px 10px', fontWeight: 700, fontSize: '0.9rem', borderLeft: '1px solid var(--surface-3)', borderRight: '1px solid var(--surface-3)' }}>{item.quantity}</span>
                  <button onClick={() => dispatch(updateQuantity({ product: item.product, quantity: Math.min(item.stock, item.quantity + 1) }))} style={{ padding: '6px 12px', color: 'var(--ink-muted)' }}>+</button>
                </div>
                <p style={{ fontWeight: 700, minWidth: 90, textAlign: 'right', fontFamily: 'var(--font-display)' }}>{formatPrice(item.price * item.quantity)}</p>
                <button onClick={() => dispatch(removeFromCart(item.product))} style={{ padding: 8, color: 'var(--crimson)', borderRadius: 8 }}
                  onMouseOver={e => e.currentTarget.style.background = '#fee2e2'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-xl)', padding: 28, position: 'sticky', top: 90 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 20 }}>Récapitulatif</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <Row label="Sous-total" value={formatPrice(total)} />
            <Row label="Livraison estimée" value="25–50 MAD" muted />
            <div style={{ height: 1, background: 'var(--surface-2)' }} />
            <Row label="Total estimé" value={formatPrice(total + 35)} bold />
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginBottom: 20, lineHeight: 1.5 }}>
            Les frais de livraison exacts seront calculés lors de la commande selon votre ville.
          </p>
          <button className="btn btn-gold w-full btn-lg" onClick={handleCheckout}>
            Commander <FiArrowRight size={16} />
          </button>
          <Link to="/products" style={{ display: 'block', textAlign: 'center', marginTop: 14, fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
            ← Continuer mes achats
          </Link>
        </div>
      </div>

      <style>{`@media(max-width:768px){.container > div:last-child{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}

function Row({ label, value, muted, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
      <span style={{ color: 'var(--ink-muted)' }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: muted ? 'var(--ink-muted)' : 'var(--ink)', fontFamily: bold ? 'var(--font-display)' : 'inherit', fontSize: bold ? '1.05rem' : undefined }}>{value}</span>
    </div>
  );
}
