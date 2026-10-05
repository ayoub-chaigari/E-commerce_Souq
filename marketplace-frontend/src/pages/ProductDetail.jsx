import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProduct, clearCurrent } from '../features/products/productSlice';
import { addToCart } from '../features/cart/cartSlice';
import { reviewService, favoriteService } from '../services/services';
import { StarRating, Modal } from '../components/common';
import { formatPrice, formatDate, primaryImage, statusClass } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiShoppingBag, FiHeart, FiShare2, FiStar,
  FiArrowLeft, FiTruck, FiShield, FiCheck,
} from 'react-icons/fi';

export default function ProductDetail() {
  const { id }     = useParams();
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { current: product, loading } = useSelector(s => s.products);
  const { user }   = useSelector(s => s.auth);

  const [qty, setQty]         = useState(1);
  const [activeImg, setActive] = useState(0);
  const [isFav, setIsFav]     = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewModal, setRM]  = useState(false);
  const [newReview, setNR]    = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSub]  = useState(false);

  useEffect(() => {
    dispatch(fetchProduct(id));
    loadReviews();
    if (user?.role === 'buyer') {
      favoriteService.check(id).then(r => setIsFav(r.data.isFavorite)).catch(() => {});
    }
    return () => dispatch(clearCurrent());
  }, [id]);

  const loadReviews = async () => {
    try {
      const r = await reviewService.getByProduct(id, { limit: 10 });
      setReviews(r.data.data);
    } catch {}
  };

  const handleAddToCart = () => {
    dispatch(addToCart({ product: product._id, name: product.name, price: product.price, image: primaryImage(product.images), stock: product.stock, quantity: qty }));
  };

  const toggleFav = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const r = await favoriteService.toggle(id);
      setIsFav(r.data.isFavorite);
    } catch {}
  };

  const submitReview = async () => {
    if (!user) { navigate('/login'); return; }
    setSub(true);
    try {
      await reviewService.create(id, newReview);
      toast.success('Avis publié !');
      setRM(false);
      setNR({ rating: 5, title: '', comment: '' });
      loadReviews();
      dispatch(fetchProduct(id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSub(false); }
  };

  if (loading || !product) {
    return (
      <div className="container" style={{ padding: '60px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <div className="skeleton" style={{ aspectRatio: 1, borderRadius: 'var(--radius-lg)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[80, 200, 100, 60, 120].map((h, i) => <div key={i} className="skeleton" style={{ height: h }} />)}
          </div>
        </div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [{ url: 'https://via.placeholder.com/600x600?text=No+Image' }];

  return (
    <div className="page-enter" style={{ padding: '32px 0 80px' }}>
      <div className="container">

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
          <Link to="/" style={{ color: 'inherit' }}>Accueil</Link>
          <span>/</span>
          <Link to="/products" style={{ color: 'inherit' }}>Boutique</Link>
          <span>/</span>
          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{product.name}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, marginBottom: 64 }}>

          {/* Images */}
          <div>
            <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', aspectRatio: 1, background: 'var(--surface-2)', marginBottom: 12 }}>
              <img src={images[activeImg]?.url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 10 }}>
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActive(i)}
                    style={{ width: 72, height: 72, borderRadius: 'var(--radius)', overflow: 'hidden', border: `2px solid ${i === activeImg ? 'var(--gold)' : 'var(--surface-3)'}`, transition: 'var(--transition)' }}>
                    <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {product.category && <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>{product.category.name}</span>}

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem,3vw,2rem)', lineHeight: 1.2 }}>{product.name}</h1>

            {product.numReviews > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <StarRating rating={product.rating} size={16} />
                <span style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>{product.rating.toFixed(1)} ({product.numReviews} avis)</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800 }}>{formatPrice(product.price)}</span>
              {product.compareAtPrice > product.price && (
                <span style={{ fontSize: '1rem', color: 'var(--ink-muted)', textDecoration: 'line-through' }}>{formatPrice(product.compareAtPrice)}</span>
              )}
            </div>

            <p style={{ color: 'var(--ink-muted)', lineHeight: 1.7 }}>{product.description}</p>

            {/* Stock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
              {product.stock > 0 ? (
                <><FiCheck size={15} color="var(--emerald)" /><span style={{ color: 'var(--emerald)', fontWeight: 600 }}>En stock ({product.stock} disponibles)</span></>
              ) : (
                <span style={{ color: 'var(--crimson)', fontWeight: 600 }}>Rupture de stock</span>
              )}
            </div>

            {/* Quantity + Add to cart */}
            {product.stock > 0 && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--surface-3)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ padding: '10px 16px', fontSize: '1.1rem', color: 'var(--ink-muted)' }}>−</button>
                  <span style={{ padding: '10px 16px', fontWeight: 700, borderLeft: '1px solid var(--surface-3)', borderRight: '1px solid var(--surface-3)' }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} style={{ padding: '10px 16px', fontSize: '1.1rem', color: 'var(--ink-muted)' }}>+</button>
                </div>
                <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleAddToCart}>
                  <FiShoppingBag size={18} /> Ajouter au panier
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className={`btn btn-outline ${isFav ? '' : ''}`} onClick={toggleFav}>
                <FiHeart size={16} fill={isFav ? 'var(--crimson)' : 'none'} color={isFav ? 'var(--crimson)' : undefined} />
                {isFav ? 'Sauvegardé' : 'Sauvegarder'}
              </button>
            </div>

            {/* Vendor */}
            {product.vendor && (
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gold)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' }}>
                  {product.vendor.name?.charAt(0)}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{product.vendor.vendorInfo?.shopName || product.vendor.name}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>Vendeur vérifié</p>
                </div>
              </div>
            )}

            {/* Perks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--surface-3)', paddingTop: 16 }}>
              {[
                { icon: <FiTruck size={15} />, text: 'Livraison à partir de 25 MAD' },
                { icon: <FiShield size={15} />, text: 'Paiement à la livraison' },
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--ink-muted)', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--emerald)' }}>{p.icon}</span>{p.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
              Avis clients {reviews.length > 0 && `(${reviews.length})`}
            </h2>
            {user?.role === 'buyer' && (
              <button className="btn btn-outline btn-sm" onClick={() => setRM(true)}>
                <FiStar size={14} /> Laisser un avis
              </button>
            )}
          </div>

          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-muted)' }}>
              <p>Soyez le premier à laisser un avis !</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {reviews.map(r => (
                <div key={r._id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}>
                        {r.buyer?.name?.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.buyer?.name}</p>
                        {r.isVerifiedPurchase && <span style={{ fontSize: '0.7rem', color: 'var(--emerald)', fontWeight: 600 }}>✓ Achat vérifié</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{formatDate(r.createdAt)}</span>
                  </div>
                  <StarRating rating={r.rating} size={14} />
                  {r.title && <p style={{ fontWeight: 600, marginTop: 8, fontSize: '0.9rem' }}>{r.title}</p>}
                  {r.comment && <p style={{ color: 'var(--ink-muted)', marginTop: 6, fontSize: '0.875rem', lineHeight: 1.6 }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review modal */}
      <Modal isOpen={reviewModal} onClose={() => setRM(false)} title="Laisser un avis"
        footer={<>
          <button className="btn btn-outline" onClick={() => setRM(false)}>Annuler</button>
          <button className="btn btn-primary" onClick={submitReview} disabled={submitting}>
            {submitting ? 'Envoi…' : 'Publier'}
          </button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="form-group">
            <label className="form-label">Note</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setNR(r => ({ ...r, rating: s }))}
                  style={{ fontSize: '1.4rem', color: s <= newReview.rating ? 'var(--gold)' : 'var(--surface-3)', transition: 'var(--transition)' }}>★</button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Titre</label>
            <input className="form-input" placeholder="Résumez votre expérience" value={newReview.title} onChange={e => setNR(r => ({ ...r, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Commentaire</label>
            <textarea className="form-input" rows={4} placeholder="Décrivez votre expérience…" value={newReview.comment} onChange={e => setNR(r => ({ ...r, comment: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <style>{`@media(max-width:768px){.container > div:nth-child(2){grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
