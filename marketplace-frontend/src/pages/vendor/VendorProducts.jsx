import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/services';
import { formatPrice, formatDate } from '../../utils/helpers';
import { PageHeader, Pagination, EmptyState } from '../../components/common';
import { primaryImage } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiStar } from 'react-icons/fi';

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [total, setTotal]   = useState(0);
  const [pages, setPages]   = useState(1);
  const [page, setPage]     = useState(1);
  const [loading, setLoad]  = useState(true);

  const load = async () => {
    setLoad(true);
    try {
      const r = await productService.getMine({ page, limit: 10 });
      setProducts(r.data.data); setTotal(r.data.total); setPages(r.data.totalPages);
    } finally { setLoad(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer "${name}" ?`)) return;
    try {
      await productService.delete(id);
      toast.success('Produit supprimé');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  return (
    <div>
      <PageHeader label="Gestion" title="Mes Produits" subtitle={`${total} produit${total !== 1 ? 's' : ''} au total`}
        action={<Link to="/vendor/products/new" className="btn btn-gold"><FiPlus size={16} /> Nouveau produit</Link>} />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState icon={<FiPackage />} title="Aucun produit" description="Créez votre premier produit pour commencer à vendre."
          action={<Link to="/vendor/products/new" className="btn btn-gold"><FiPlus size={14} /> Créer un produit</Link>} />
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--surface-3)' }}>
                {['Produit', 'Prix', 'Stock', 'Note', 'Créé le', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id} style={{ borderBottom: '1px solid var(--surface-2)' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={primaryImage(p.images)} alt={p.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: 'var(--surface-2)' }} />
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                        <p style={{ fontSize: '0.72rem', color: p.isActive ? 'var(--emerald)' : 'var(--crimson)', fontWeight: 600 }}>{p.isActive ? 'Actif' : 'Inactif'}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{formatPrice(p.price)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ color: p.stock <= 5 ? 'var(--crimson)' : p.stock <= 15 ? '#92400e' : 'var(--emerald)', fontWeight: 600, fontSize: '0.875rem' }}>
                      {p.stock} unités
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {p.numReviews > 0 ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                        <FiStar size={13} fill="var(--gold)" color="var(--gold)" /> {p.rating.toFixed(1)}
                        <span style={{ color: 'var(--ink-muted)' }}>({p.numReviews})</span>
                      </span>
                    ) : <span style={{ color: 'var(--ink-muted)', fontSize: '0.8rem' }}>—</span>}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{formatDate(p.createdAt)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link to={`/vendor/products/${p._id}/edit`} className="btn btn-outline btn-sm"><FiEdit2 size={13} /></Link>
                      <button className="btn btn-sm" style={{ color: 'var(--crimson)', border: '1.5px solid var(--surface-3)' }} onClick={() => handleDelete(p._id, p.name)}><FiTrash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={pages} onPageChange={setPage} />
    </div>
  );
}
