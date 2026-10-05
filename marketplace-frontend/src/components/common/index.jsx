import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../features/cart/cartSlice';
import { FiShoppingBag, FiHeart, FiStar, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { primaryImage, formatPrice, truncate } from '../../utils/helpers';

/* ── ProductCard ────────────────────────────────────────────────────────── */
export function ProductCard({ product, onToggleFav, isFav }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);

  const handleAddToCart = (e) => {
    e.preventDefault();
    dispatch(addToCart({
      product: product._id,
      name: product.name,
      price: product.price,
      image: primaryImage(product.images),
      stock: product.stock,
      vendor: product.vendor?._id,
    }));
  };

  return (
    <Link to={`/products/${product._id}`} className="product-card card card-hover">
      <div className="product-card-image">
        <img src={primaryImage(product.images)} alt={product.name} loading="lazy" />
        {product.stock === 0 && <span className="out-of-stock-badge">Rupture de stock</span>}
        {product.isFeatured && <span className="featured-badge">Vedette</span>}
        {user?.role === 'buyer' && (
          <button
            className={`fav-btn ${isFav ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); onToggleFav?.(product._id); }}
          >
            <FiHeart size={16} fill={isFav ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      <div className="product-card-body">
        {product.category && <span className="product-category">{product.category.name}</span>}
        <h3 className="product-name">{truncate(product.name, 55)}</h3>
        <div className="product-meta">
          {product.numReviews > 0 && (
            <div className="product-rating">
              <FiStar size={12} fill="var(--gold)" color="var(--gold)" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="review-count">({product.numReviews})</span>
            </div>
          )}
          {product.vendor?.vendorInfo?.shopName && (
            <span className="product-vendor">{product.vendor.vendorInfo.shopName}</span>
          )}
        </div>
        <div className="product-footer">
          <span className="product-price">{formatPrice(product.price)}</span>
          {product.stock > 0 && (
            <button className="add-to-cart-btn" onClick={handleAddToCart}>
              <FiShoppingBag size={15} />
            </button>
          )}
        </div>
      </div>
      <style>{`
        .product-card { display:flex; flex-direction:column; overflow:hidden; text-decoration:none; color:inherit; }
        .product-card-image { position:relative; aspect-ratio:1; overflow:hidden; background:var(--surface-2); }
        .product-card-image img { width:100%; height:100%; object-fit:cover; transition:transform 0.4s ease; }
        .product-card:hover .product-card-image img { transform:scale(1.05); }
        .out-of-stock-badge { position:absolute; inset:0; background:rgba(10,10,15,0.45); color:#fff; display:flex; align-items:center; justify-content:center; font-size:0.78rem; font-weight:600; letter-spacing:0.05em; }
        .featured-badge { position:absolute; top:10px; left:10px; background:var(--gold); color:var(--ink); font-size:0.68rem; font-weight:800; padding:3px 10px; border-radius:99px; letter-spacing:0.06em; text-transform:uppercase; }
        .fav-btn { position:absolute; top:10px; right:10px; width:32px; height:32px; background:rgba(255,255,255,0.9); border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--ink-muted); transition:var(--transition); backdrop-filter:blur(4px); }
        .fav-btn:hover,.fav-btn.active { color:var(--crimson); background:white; }
        .product-card-body { padding:16px; display:flex; flex-direction:column; gap:6px; flex:1; }
        .product-category { font-size:0.7rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--gold); }
        .product-name { font-family:var(--font-display); font-size:1rem; font-weight:600; color:var(--ink); line-height:1.3; }
        .product-meta { display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .product-rating { display:flex; align-items:center; gap:4px; font-size:0.78rem; font-weight:600; color:var(--ink); }
        .review-count { color:var(--ink-muted); font-weight:400; }
        .product-vendor { font-size:0.72rem; color:var(--ink-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:120px; }
        .product-footer { display:flex; align-items:center; justify-content:space-between; margin-top:auto; padding-top:8px; border-top:1px solid var(--surface-2); }
        .product-price { font-size:1.05rem; font-weight:700; color:var(--ink); font-family:var(--font-display); }
        .add-to-cart-btn { width:34px; height:34px; background:var(--ink); color:white; border-radius:10px; display:flex; align-items:center; justify-content:center; transition:var(--transition); }
        .add-to-cart-btn:hover { background:var(--gold); color:var(--ink); transform:scale(1.05); }
      `}</style>
    </Link>
  );
}

/* ── Pagination ─────────────────────────────────────────────────────────── */
export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  return (
    <div className="pagination">
      <button className="page-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <FiChevronLeft size={16} />
      </button>
      {visible.reduce((acc, p, i) => {
        if (i > 0 && p - visible[i - 1] > 1) acc.push(<span key={`gap${p}`} style={{ padding: '0 4px', color: 'var(--ink-muted)' }}>…</span>);
        acc.push(
          <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
        );
        return acc;
      }, [])}
      <button className="page-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        <FiChevronRight size={16} />
      </button>
    </div>
  );
}

/* ── StarRating ─────────────────────────────────────────────────────────── */
export function StarRating({ rating, size = 14, showCount, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <FiStar
          key={s}
          size={size}
          color="var(--gold)"
          fill={s <= Math.floor(rating) ? 'var(--gold)' : s <= rating + 0.5 ? 'var(--gold)' : 'none'}
        />
      ))}
      {showCount && <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginLeft: 4 }}>({count})</span>}
    </div>
  );
}

/* ── Modal ──────────────────────────────────────────────────────────────── */
export function Modal({ isOpen, onClose, title, children, footer }) {
  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>{title}</h3>
          <button onClick={onClose} style={{ padding: 6, borderRadius: 8, color: 'var(--ink-muted)' }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}>
            <FiX size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ── Spinner ────────────────────────────────────────────────────────────── */
export function Spinner({ size = 24, color = 'currentColor' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid rgba(0,0,0,0.1)`,
      borderTopColor: color,
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

/* ── Empty State ────────────────────────────────────────────────────────── */
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

/* ── Stat Card ──────────────────────────────────────────────────────────── */
export function StatCard({ label, value, icon, color = 'var(--gold)', sub }) {
  return (
    <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)' }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </div>
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1 }}>{value}</p>
      {sub && <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{sub}</p>}
    </div>
  );
}

/* ── Page Header ────────────────────────────────────────────────────────── */
export function PageHeader({ label, title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
      <div>
        {label && <span className="section-label">{label}</span>}
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem,3vw,2rem)', color: 'var(--ink)' }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--ink-muted)', marginTop: 6, fontSize: '0.9rem' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
