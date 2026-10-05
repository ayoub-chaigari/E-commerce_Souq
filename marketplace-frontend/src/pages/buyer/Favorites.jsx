// Favorites.jsx
import React, { useEffect, useState } from 'react';
import { favoriteService } from '../../services/services';
import { ProductCard, EmptyState } from '../../components/common';
import { FiHeart } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function Favorites() {
  const [favs, setFavs]     = useState([]);
  const [loading, setLoad]  = useState(true);
  const [favSet, setFavSet] = useState(new Set());

  const load = async () => {
    try {
      const r = await favoriteService.getAll();
      setFavs(r.data.favorites);
      setFavSet(new Set(r.data.favorites.map(f => f.product?._id)));
    } finally { setLoad(false); }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id) => {
    await favoriteService.toggle(id);
    setFavSet(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    setFavs(f => f.filter(i => i.product?._id !== id || favSet.has(id)));
    load();
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-muted)' }}>Chargement…</div>;
  if (!favs.length) return (
    <EmptyState icon={<FiHeart />} title="Aucun favori" description="Sauvegardez vos produits préférés pour les retrouver ici."
      action={<Link to="/products" className="btn btn-primary">Explorer la boutique</Link>} />
  );

  return (
    <div>
      <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem', marginBottom: 20 }}>{favs.length} produit{favs.length > 1 ? 's' : ''} sauvegardé{favs.length > 1 ? 's' : ''}</p>
      <div className="product-grid">
        {favs.map(f => f.product && (
          <ProductCard key={f._id} product={f.product} isFav={favSet.has(f.product._id)} onToggleFav={toggle} />
        ))}
      </div>
    </div>
  );
}
