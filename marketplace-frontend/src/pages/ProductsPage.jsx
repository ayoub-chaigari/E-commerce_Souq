import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories } from '../features/products/productSlice';
import { favoriteService } from '../services/services';
import { ProductCard, Pagination, EmptyState } from '../components/common';
import { FiFilter, FiX, FiSearch, FiPackage } from 'react-icons/fi';

export default function ProductsPage() {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();
  const { list, categories, loading, total, totalPages, currentPage } = useSelector(s => s.products);
  const { user } = useSelector(s => s.auth);
  const [favs, setFavs] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const filters = {
    search:   params.get('search')   || '',
    category: params.get('category') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    sort:     params.get('sort')     || '-createdAt',
    page:     Number(params.get('page')) || 1,
    inStock:  params.get('inStock')  || '',
  };

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  useEffect(() => {
    dispatch(fetchProducts({ ...filters, limit: 12 }));
    dispatch(fetchCategories());
  }, [params.toString()]);

  useEffect(() => {
    if (user?.role === 'buyer') {
      favoriteService.getAll().then(r => setFavs(new Set(r.data.favorites.map(f => f.product?._id)))).catch(() => {});
    }
  }, [user]);

  const toggleFav = async (id) => {
    try {
      await favoriteService.toggle(id);
      setFavs(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    } catch {}
  };

  const clearFilters = () => setParams({});
  const hasFilters = filters.search || filters.category || filters.minPrice || filters.maxPrice || filters.inStock;

  const sortOptions = [
    { value: '-createdAt', label: 'Plus récents' },
    { value: 'price',      label: 'Prix : croissant' },
    { value: '-price',     label: 'Prix : décroissant' },
    { value: '-rating',    label: 'Mieux notés' },
    { value: '-totalSold', label: 'Meilleures ventes' },
  ];

  return (
    <div className="page-enter" style={{ padding: '40px 0 80px' }}>
      <div className="container">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem,3vw,2rem)' }}>
              {filters.search ? `Résultats pour "${filters.search}"` : 'Tous les produits'}
            </h1>
            {!loading && <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem', marginTop: 4 }}>{total} produit{total !== 1 ? 's' : ''}</p>}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select className="form-input" style={{ padding: '8px 14px', fontSize: '0.875rem' }}
              value={filters.sort} onChange={e => setFilter('sort', e.target.value)}>
              {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button className="btn btn-outline btn-sm" onClick={() => setShowFilters(v => !v)}>
              <FiFilter size={14} /> Filtres {hasFilters && '●'}
            </button>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 28, border: '1px solid var(--surface-3)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Recherche</label>
              <div style={{ position: 'relative' }}>
                <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} size={14} />
                <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Mot-clé…"
                  value={filters.search} onChange={e => setFilter('search', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Catégorie</label>
              <select className="form-input" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
                <option value="">Toutes</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Prix min (MAD)</label>
              <input className="form-input" type="number" placeholder="0" value={filters.minPrice} onChange={e => setFilter('minPrice', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Prix max (MAD)</label>
              <input className="form-input" type="number" placeholder="9999" value={filters.maxPrice} onChange={e => setFilter('maxPrice', e.target.value)} />
            </div>
            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <label className="form-label" style={{ opacity: 0 }}>.</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500 }}>
                <input type="checkbox" checked={filters.inStock === 'true'} onChange={e => setFilter('inStock', e.target.checked ? 'true' : '')} />
                En stock uniquement
              </label>
              {hasFilters && (
                <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{ color: 'var(--crimson)', marginTop: 8 }}>
                  <FiX size={13} /> Effacer les filtres
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {hasFilters && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {filters.search && <Chip label={`"${filters.search}"`} onRemove={() => setFilter('search', '')} />}
            {filters.category && <Chip label={categories.find(c => c._id === filters.category)?.name} onRemove={() => setFilter('category', '')} />}
            {filters.minPrice && <Chip label={`Min: ${filters.minPrice} MAD`} onRemove={() => setFilter('minPrice', '')} />}
            {filters.maxPrice && <Chip label={`Max: ${filters.maxPrice} MAD`} onRemove={() => setFilter('maxPrice', '')} />}
            {filters.inStock && <Chip label="En stock" onRemove={() => setFilter('inStock', '')} />}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card" style={{ height: 340 }}>
                <div className="skeleton" style={{ height: 200 }} />
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ height: 10, width: '40%' }} />
                  <div className="skeleton" style={{ height: 16, width: '80%' }} />
                  <div className="skeleton" style={{ height: 20, width: '50%', marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState icon={<FiPackage />} title="Aucun produit trouvé"
            description="Essayez d'autres filtres ou mots-clés."
            action={hasFilters && <button className="btn btn-outline" onClick={clearFilters}>Effacer les filtres</button>} />
        ) : (
          <div className="product-grid">
            {list.map(p => <ProductCard key={p._id} product={p} isFav={favs.has(p._id)} onToggleFav={toggleFav} />)}
          </div>
        )}

        <Pagination page={currentPage} totalPages={totalPages} onPageChange={p => setFilter('page', p)} />
      </div>
    </div>
  );
}

function Chip({ label, onRemove }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--gold-pale)', color: 'var(--ink)', padding: '4px 12px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600 }}>
      {label}
      <button onClick={onRemove} style={{ color: 'var(--ink-muted)', display: 'flex' }}><FiX size={12} /></button>
    </span>
  );
}
