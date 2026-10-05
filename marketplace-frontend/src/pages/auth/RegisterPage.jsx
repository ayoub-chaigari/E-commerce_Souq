import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../../features/auth/authSlice';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiShoppingBag, FiZap } from 'react-icons/fi';
import './Auth.css';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const { loading } = useSelector(s => s.auth);
  const [form, setForm]   = useState({ name: '', email: '', password: '', role: 'buyer', shopName: '' });
  const [show, setShow]   = useState(false);
  const upd = (k, v)      => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(register(form));
  };

  return (
    <div className="auth-page page-enter">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo-mark">S</div>
          <span>Souq</span>
        </div>
        <h1 className="auth-title">Créer un compte</h1>
        <p className="auth-subtitle">Rejoignez la marketplace marocaine</p>

        {/* Role toggle */}
        <div className="role-toggle">
          <button type="button" className={`role-btn ${form.role === 'buyer' ? 'active' : ''}`} onClick={() => upd('role', 'buyer')}>
            <FiShoppingBag size={18} />
            <span>Acheteur</span>
            <small>Je veux acheter</small>
          </button>
          <button type="button" className={`role-btn ${form.role === 'vendor' ? 'active' : ''}`} onClick={() => upd('role', 'vendor')}>
            <FiZap size={18} />
            <span>Vendeur</span>
            <small>Je veux vendre</small>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Nom complet</label>
            <div className="input-icon-wrap">
              <FiUser className="input-icon" size={16} />
              <input className="form-input input-with-icon" placeholder="Mohammed Alami"
                value={form.name} onChange={e => upd('name', e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-icon-wrap">
              <FiMail className="input-icon" size={16} />
              <input className="form-input input-with-icon" type="email" placeholder="vous@exemple.com"
                value={form.email} onChange={e => upd('email', e.target.value)} required />
            </div>
          </div>
          {form.role === 'vendor' && (
            <div className="form-group">
              <label className="form-label">Nom de la boutique</label>
              <input className="form-input" placeholder="Ma Boutique Artisanale"
                value={form.shopName} onChange={e => upd('shopName', e.target.value)} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <div className="input-icon-wrap">
              <FiLock className="input-icon" size={16} />
              <input className="form-input input-with-icon" type={show ? 'text' : 'password'} placeholder="Min. 6 caractères"
                value={form.password} onChange={e => upd('password', e.target.value)} required minLength={6} />
              <button type="button" className="input-icon-right" onClick={() => setShow(v => !v)}>
                {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>
          {form.role === 'vendor' && (
            <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>
              Votre compte vendeur sera activé après validation par notre équipe.
            </div>
          )}
          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? <><span className="spinner" /> Création…</> : 'Créer mon compte'}
          </button>
        </form>
        <p className="auth-switch">Déjà un compte ? <Link to="/login">Connexion</Link></p>
      </div>
    </div>
  );
}
