import React, { useEffect, useState } from 'react';
import { productService, adminService } from '../../services/services';
import { PageHeader, Pagination } from '../../components/common';
import { formatPrice, formatDate, primaryImage } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { FiStar, FiTrash2 } from 'react-icons/fi';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [loading, setLoad]      = useState(true);
  const [search, setSearch]     = useState('');

  const load = async () => {
    setLoad(true);
    try {
      const r = await productService.getAll({ page, limit: 15, search: search || undefined });
      setProducts(r.data.data); setPages(r.data.totalPages); setTotal(r.data.total);
    } finally { setLoad(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const toggleFeature = async (id, name) => {
    try {
      await adminService.toggleFeature(id);
      toast.success(`Produit mis à jour`);
      load();
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer "${name}" ?`)) return;
    try {
      await productService.delete(id);
      toast.success('Produit supprimé');
      load();
    } catch { toast.error('Erreur'); }
  };

  return (
    <div>
      <PageHeader label="Administration" title="Tous les produits" subtitle={`${total} produit${total !== 1 ? 's' : ''}`} />

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 24, maxWidth: 420 }}>
        <input className="form-input" placeholder="Rechercher un produit…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
        <button type="submit" className="btn btn-outline">Chercher</button>
      </form>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--surface-3)' }}>
              {['Produit', 'Vendeur', 'Prix', 'Stock', 'Note', 'Vedette', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <tr key={i}><td colSpan={7} style={{ padding: 12 }}><div className="skeleton" style={{ height: 20 }} /></td></tr>)
              : products.map(p => (
                  <tr key={p._id} style={{ borderBottom: '1px solid var(--surface-2)', transition: 'background 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--surface)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={primaryImage(p.images)} alt={p.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: 'var(--surface-2)' }} />
                        <p style={{ fontWeight: 600, fontSize: '0.85rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{p.vendor?.vendorInfo?.shopName || p.vendor?.name || '—'}</td>
                    <td style={{ padding: '13px 16px', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>{formatPrice(p.price)}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: p.stock === 0 ? 'var(--crimson)' : p.stock <= 5 ? '#92400e' : 'var(--emerald)' }}>{p.stock}</span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      {p.numReviews > 0 ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem' }}>
                          <FiStar size={12} fill="var(--gold)" color="var(--gold)" /> {p.rating?.toFixed(1)}
                        </span>
                      ) : <span style={{ color: 'var(--ink-muted)', fontSize: '0.8rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <button onClick={() => toggleFeature(p._id, p.name)}
                        style={{ padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, background: p.isFeatured ? 'var(--gold)' : 'var(--surface-2)', color: p.isFeatured ? 'var(--ink)' : 'var(--ink-muted)', border: 'none', cursor: 'pointer', transition: 'var(--transition)' }}>
                        {p.isFeatured ? '★ Vedette' : '☆ Mettre en avant'}
                      </button>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <button className="btn btn-sm" style={{ border: '1.5px solid var(--surface-3)', color: 'var(--crimson)' }} onClick={() => handleDelete(p._id, p.name)}>
                        <FiTrash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={pages} onPageChange={setPage} />
    </div>
  );
}
