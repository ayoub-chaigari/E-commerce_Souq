import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories } from '../features/products/productSlice';
import { favoriteService } from '../services/services';
import { addToCart } from '../features/cart/cartSlice';
import { ProductCard } from '../components/common';
import { FiArrowRight, FiZap, FiTruck, FiShield, FiStar } from 'react-icons/fi';
import './HomePage.css';

export default function HomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: products, categories, loading } = useSelector(s => s.products);
  const { user } = useSelector(s => s.auth);
  const [favs, setFavs] = useState(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchProducts({ limit: 8, featured: true }));
    dispatch(fetchCategories());
    if (user?.role === 'buyer') {
      favoriteService.getAll().then(r => setFavs(new Set(r.data.favorites.map(f => f.product?._id)))).catch(() => {});
    }
  }, [dispatch, user]);

  const toggleFav = async (id) => {
    try {
      await favoriteService.toggle(id);
      setFavs(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    } catch {}
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="home page-enter">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-blob hero-blob-1" />
          <div className="hero-blob hero-blob-2" />
          <div className="hero-grain" />
        </div>
        <div className="hero-content container">
          <div className="hero-text">
            <span className="hero-label">✦ Marketplace Marocaine</span>
            <h1 className="hero-title">
              Découvrez des<br />
              <em>Trésors Locaux</em><br />
              Livrés chez vous
            </h1>
            <p className="hero-sub">
              Des milliers de produits sélectionnés par des vendeurs passionnés.
              Assisté par intelligence artificielle.
            </p>
            <form className="hero-search" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Que cherchez-vous aujourd'hui ?"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-gold">Rechercher</button>
            </form>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-lg">
                Parcourir la boutique <FiArrowRight />
              </Link>
              <Link to="/register" className="btn btn-outline btn-lg">Devenir vendeur</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card hero-card-main">
              <div className="hero-card-img" />
              <div className="hero-card-body">
                <span className="hero-card-cat">Artisanat</span>
                <p className="hero-card-name">Tajine en Poterie de Safi</p>
                <p className="hero-card-price">180 MAD</p>
              </div>
            </div>
            <div className="hero-card hero-card-float hero-card-float-1">
              <FiStar fill="var(--gold)" color="var(--gold)" size={14} />
              <span>4.8 · 34 avis</span>
            </div>
            <div className="hero-card hero-card-float hero-card-float-2">
              <FiTruck size={14} color="var(--emerald)" />
              <span>Livraison 25 MAD</span>
            </div>
            <div className="hero-badge">
              <FiZap size={16} color="var(--gold)" />
              <span>IA Intégrée</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="features-bar">
        <div className="container">
          <div className="features-grid">
            {[
              { icon: <FiTruck />, title: 'Livraison partout au Maroc', sub: 'À partir de 25 MAD' },
              { icon: <FiShield />, title: 'Paiement à la livraison', sub: 'Sécurisé et simple' },
              { icon: <FiZap />, title: 'Assistant IA', sub: 'Pour les vendeurs' },
              { icon: <FiStar />, title: 'Vendeurs vérifiés', sub: 'Qualité garantie' },
            ].map((f, i) => (
              <div key={i} className="feature-item">
                <div className="feature-icon">{f.icon}</div>
                <div>
                  <p className="feature-title">{f.title}</p>
                  <p className="feature-sub">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="section container">
          <div className="section-header">
            <span className="section-label">Explorer</span>
            <h2 className="section-title">Catégories</h2>
          </div>
          <div className="categories-grid">
            {categories.slice(0, 6).map(cat => (
              <Link key={cat._id} to={`/products?category=${cat._id}`} className="category-card">
                <div className="category-icon">
                  {cat.name.charAt(0)}
                </div>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Products ────────────────────────────────── */}
      <section className="section container">
        <div className="section-header flex justify-between items-center">
          <div>
            <span className="section-label">Sélection</span>
            <h2 className="section-title">Produits Vedettes</h2>
          </div>
          <Link to="/products" className="btn btn-outline">
            Voir tout <FiArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="product-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card" style={{ height: 340 }}>
                <div className="skeleton" style={{ height: 200 }} />
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ height: 12, width: '40%' }} />
                  <div className="skeleton" style={{ height: 16, width: '80%' }} />
                  <div className="skeleton" style={{ height: 20, width: '50%', marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="product-grid">
            {products.map(p => (
              <ProductCard key={p._id} product={p} isFav={favs.has(p._id)} onToggleFav={toggleFav} />
            ))}
          </div>
        )}
      </section>

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <section className="cta-banner">
        <div className="container cta-inner">
          <div>
            <h2>Vous êtes vendeur ?</h2>
            <p>Créez votre boutique et utilisez notre assistant IA pour générer des descriptions percutantes en 3 langues.</p>
          </div>
          <Link to="/register" className="btn btn-gold btn-lg">
            Commencer gratuitement <FiArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
}
