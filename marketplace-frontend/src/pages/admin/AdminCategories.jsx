import React, { useEffect, useState } from 'react';
import { categoryService } from '../../services/services';
import { PageHeader, Modal } from '../../components/common';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiTag } from 'react-icons/fi';

export default function AdminCategories() {
  const [categories, setCats] = useState([]);
  const [loading, setLoad]    = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({ name: '', description: '' });
  const [saving, setSaving]   = useState(false);

  const load = async () => {
    setLoad(true);
    try { const r = await categoryService.getAll(); setCats(r.data.categories); }
    finally { setLoad(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setModal(true); };
  const openEdit   = (cat) => { setEditing(cat); setForm({ name: cat.name, description: cat.description || '' }); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await categoryService.update(editing._id, form);
        toast.success('Catégorie mise à jour');
      } else {
        await categoryService.create(form);
        toast.success('Catégorie créée');
      }
      setModal(false); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer "${name}" ?`)) return;
    try {
      await categoryService.delete(id);
      toast.success('Catégorie supprimée');
      load();
    } catch { toast.error('Erreur'); }
  };

  return (
    <div>
      <PageHeader label="Administration" title="Catégories"
        action={<button className="btn btn-gold" onClick={openCreate}><FiPlus size={16} /> Nouvelle catégorie</button>} />

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
          {categories.map(cat => (
            <div key={cat._id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gold-pale)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>
                  {cat.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</p>
                  {cat.description && <p style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.description}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => openEdit(cat)}><FiEdit2 size={13} /> Modifier</button>
                <button className="btn btn-sm" style={{ border: '1.5px solid var(--surface-3)', color: 'var(--crimson)' }} onClick={() => handleDelete(cat._id, cat.name)}><FiTrash2 size={13} /></button>
              </div>
            </div>
          ))}

          {/* Add card */}
          <button onClick={openCreate}
            style={{ background: 'transparent', border: '2px dashed var(--surface-3)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'var(--transition)', color: 'var(--ink-muted)' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--ink-muted)'; }}>
            <FiPlus size={24} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Nouvelle catégorie</span>
          </button>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setModal(false)}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? '…' : 'Sauvegarder'}</button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Nom *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
