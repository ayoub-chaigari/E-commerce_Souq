import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../features/auth/authSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector(s => s.auth);

  const [form, setForm] = useState({
    name:    user?.name || '',
    phone:   user?.phone || '',
    street:  user?.address?.street || '',
    city:    user?.address?.city || '',
    postalCode: user?.address?.postalCode || '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleProfile = (e) => {
    e.preventDefault();
    dispatch(updateProfile({ name: form.name, phone: form.phone, address: { street: form.street, city: form.city, postalCode: form.postalCode } }));
  };

  const handlePw = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) { toast.error('Min. 6 caractères'); return; }
    setPwLoading(true);
    try {
      await api.put('/auth/change-password', pwForm);
      toast.success('Mot de passe modifié');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setPwLoading(false); }
  };

  const Section = ({ title, children }) => (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 20 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 22 }}>{title}</h3>
      {children}
    </div>
  );

  return (
    <div>
      <Section title="Informations personnelles">
        <form onSubmit={handleProfile}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Nom complet</label>
              <input className="form-input" value={form.name} onChange={e => upd('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input className="form-input" value={form.phone} onChange={e => upd('phone', e.target.value)} placeholder="+212 6XX-XXXXXX" />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Adresse</label>
              <input className="form-input" value={form.street} onChange={e => upd('street', e.target.value)} placeholder="Rue, quartier, numéro" />
            </div>
            <div className="form-group">
              <label className="form-label">Ville</label>
              <input className="form-input" value={form.city} onChange={e => upd('city', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Code postal</label>
              <input className="form-input" value={form.postalCode} onChange={e => upd('postalCode', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sauvegarde…' : 'Sauvegarder les modifications'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--ink-muted)', padding: '6px 12px', background: 'var(--surface)', borderRadius: 8 }}>
              <span>Email : {user?.email}</span>
            </div>
          </div>
        </form>
      </Section>

      <Section title="Changer le mot de passe">
        <form onSubmit={handlePw}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Mot de passe actuel</label>
              <input className="form-input" type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Nouveau mot de passe</label>
              <input className="form-input" type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required minLength={6} />
            </div>
          </div>
          <button type="submit" className="btn btn-outline" disabled={pwLoading}>
            {pwLoading ? 'Modification…' : 'Modifier le mot de passe'}
          </button>
        </form>
      </Section>

      <Section title="Informations du compte">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[['Rôle', user?.role === 'buyer' ? 'Acheteur' : user?.role === 'vendor' ? 'Vendeur' : 'Administrateur'],
            ['Statut', user?.isActive ? 'Actif' : 'Inactif'],
            ...(user?.role === 'vendor' ? [['Boutique', user?.vendorInfo?.shopName || '—'], ['Approbation', user?.vendorInfo?.isApproved ? 'Approuvé ✓' : 'En attente']] : []),
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 16, fontSize: '0.875rem', padding: '8px 0', borderBottom: '1px solid var(--surface-2)' }}>
              <span style={{ color: 'var(--ink-muted)', minWidth: 120 }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
