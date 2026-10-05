import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../features/auth/authSlice';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import './Auth.css';

export default function LoginPage() {
  const dispatch = useDispatch();
  const { loading } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(form));
  };

  return (
    <div className="auth-page page-enter">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo-mark">S</div>
          <span>Souq</span>
        </div>
        <h1 className="auth-title">Bon retour !</h1>
        <p className="auth-subtitle">Connectez-vous à votre compte</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-icon-wrap">
              <FiMail className="input-icon" size={16} />
              <input className="form-input input-with-icon" type="email" placeholder="vous@exemple.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <div className="input-icon-wrap">
              <FiLock className="input-icon" size={16} />
              <input className="form-input input-with-icon" type={show ? 'text' : 'password'} placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              <button type="button" className="input-icon-right" onClick={() => setShow(v => !v)}>
                {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? <><span className="spinner" /> Connexion…</> : 'Se connecter'}
          </button>
        </form>

        <div className="auth-demo">
          <p>Comptes de test :</p>
          {[
            { role: 'Acheteur', email: 'buyer@marketplace.ma',  pw: 'Buyer@123'  },
            { role: 'Vendeur',  email: 'vendor@marketplace.ma', pw: 'Vendor@123' },
            { role: 'Admin',    email: 'admin@marketplace.ma',  pw: 'Admin@123'  },
          ].map(a => (
            <button key={a.role} className="demo-btn" onClick={() => setForm({ email: a.email, password: a.pw })}>
              <strong>{a.role}</strong> — {a.email}
            </button>
          ))}
        </div>

        <p className="auth-switch">Pas encore de compte ? <Link to="/register">Inscription</Link></p>
      </div>
    </div>
  );
}
