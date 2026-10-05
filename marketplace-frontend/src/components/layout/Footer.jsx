import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner container">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="logo-mark-sm">S</span>
            <span>Souq</span>
          </div>
          <p className="footer-tagline">La marketplace marocaine assistée par IA. Découvrez des milliers de produits.</p>
        </div>
        <div className="footer-links">
          <div>
            <h4>Boutique</h4>
            <Link to="/products">Tous les produits</Link>
            <Link to="/products?featured=true">Produits vedettes</Link>
            <Link to="/products?inStock=true">En stock</Link>
          </div>
          <div>
            <h4>Mon compte</h4>
            <Link to="/account/orders">Mes commandes</Link>
            <Link to="/account/favorites">Favoris</Link>
            <Link to="/account/profile">Profil</Link>
          </div>
          <div>
            <h4>Vendeurs</h4>
            <Link to="/register">Devenir vendeur</Link>
            <Link to="/vendor">Tableau de bord</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom container">
        <p>© {new Date().getFullYear()} Souq Marketplace. Tous droits réservés.</p>
        <p>Paiement à la livraison · Livraison partout au Maroc</p>
      </div>
    </footer>
  );
}
