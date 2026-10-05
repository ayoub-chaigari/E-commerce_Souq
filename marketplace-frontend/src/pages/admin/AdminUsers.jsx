import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/services';
import { PageHeader, Pagination } from '../../components/common';
import { formatDate, roleLabel } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { FiSearch, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

export default function AdminUsers() {
  const [users, setUsers]   = useState([]);
  const [pages, setPages]   = useState(1);
  const [page, setPage]     = useState(1);
  const [total, setTotal]   = useState(0);
  const [loading, setLoad]  = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole]     = useState('');

  const load = async () => {
    setLoad(true);
    try {
      const r = await adminService.getUsers({ page, limit: 15, search: search || undefined, role: role || undefined });
      setUsers(r.data.data); setPages(r.data.totalPages); setTotal(r.data.total);
    } finally { setLoad(false); }
  };

  useEffect(() => { load(); }, [page, role]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const toggleStatus = async (userId, name, isActive) => {
    if (!window.confirm(`${isActive ? 'Désactiver' : 'Activer'} le compte de ${name} ?`)) return;
    try {
      await adminService.toggleUserStatus(userId);
      toast.success(`Compte ${isActive ? 'désactivé' : 'activé'}`);
      load();
    } catch { toast.error('Erreur'); }
  };

  const ROLE_COLORS = { buyer: 'var(--sky)', vendor: 'var(--gold)', admin: 'var(--crimson)' };

  return (
    <div>
      <PageHeader label="Administration" title="Utilisateurs" subtitle={`${total} utilisateur${total !== 1 ? 's' : ''}`} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 400 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} size={15} />
            <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Nom ou email…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-outline">Chercher</button>
        </form>
        <select className="form-input" style={{ width: 160 }} value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
          <option value="">Tous les rôles</option>
          <option value="buyer">Acheteurs</option>
          <option value="vendor">Vendeurs</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--surface-3)' }}>
              {['Utilisateur', 'Rôle', 'Statut', 'Inscription', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} style={{ padding: 12 }}>
                    <div className="skeleton" style={{ height: 20 }} />
                  </td></tr>
                ))
              : users.map(u => (
                  <tr key={u._id} style={{ borderBottom: '1px solid var(--surface-2)', transition: 'background 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--surface)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${ROLE_COLORS[u.role]}22`, color: ROLE_COLORS[u.role], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0 }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: ROLE_COLORS[u.role] }}>{roleLabel(u.role)}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600, color: u.isActive ? 'var(--emerald)' : 'var(--crimson)' }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: u.isActive ? 'var(--emerald)' : 'var(--crimson)' }} />
                        {u.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{formatDate(u.createdAt)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {u.role !== 'admin' && (
                        <button className="btn btn-sm btn-outline" onClick={() => toggleStatus(u._id, u.name, u.isActive)}
                          style={{ color: u.isActive ? 'var(--crimson)' : 'var(--emerald)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {u.isActive ? <FiToggleRight size={14} /> : <FiToggleLeft size={14} />}
                          {u.isActive ? 'Désactiver' : 'Activer'}
                        </button>
                      )}
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
