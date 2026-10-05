# 🛒 Souq — Marketplace Multi-Vendeurs avec IA & PayPal

Projet full-stack complet : **marketplace e-commerce marocaine** avec assistant IA, paiement PayPal, livraison simulée, et gestion multi-rôles.

---

## 📁 Structure du projet

```
/
├── marketplace-backend/    → API Node.js + Express + MongoDB
└── marketplace-frontend/   → React 18 + Redux Toolkit + PayPal
```

---

## ⚡ Démarrage rapide

### 1. Backend

```bash
cd marketplace-backend
npm install
cp .env.example .env        # Remplir les variables (voir ci-dessous)
npm run seed                # Données de test (optionnel)
npm run dev                 # Démarre sur http://localhost:5000
```

### 2. Frontend

```bash
cd marketplace-frontend
npm install
# Éditer .env avec votre clé Stripe publique
npm start                   # Démarre sur http://localhost:3000
```

---

## 🔑 Variables d'environnement

### Backend — `marketplace-backend/.env`

```env
# Serveur
PORT=5000
NODE_ENV=development

# Base de données
MONGO_URI=mongodb://localhost:27017/marketplace

# Authentification
JWT_SECRET=votre_secret_jwt_tres_long_min_32_caracteres
JWT_EXPIRE=7d

# PayPal (paiement en ligne)
PAYPAL_CLIENT_ID=votre_paypal_client_id
PAYPAL_CLIENT_SECRET=votre_paypal_client_secret
PAYPAL_MODE=sandbox

# Cloudinary (images — optionnel, fallback local)
CLOUDINARY_CLOUD_NAME=votre_cloud
CLOUDINARY_API_KEY=votre_cle
CLOUDINARY_API_SECRET=votre_secret

# IA — OpenAI ou compatible
AI_API_KEY=sk-...
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-3.5-turbo

# CORS
CLIENT_URL=http://localhost:3000
```

### Frontend — `marketplace-frontend/.env`

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_PAYPAL_CLIENT_ID=votre_paypal_client_id
```

---

## 💳 Configuration PayPal

### Étape 1 — Créer un compte PayPal
→ https://developer.paypal.com/

### Étape 2 — Créer une application REST API
Dans le PayPal Developer Dashboard : **My Apps & Credentials → Create App**

| Variable | Valeur |
|----------|--------|
| `PAYPAL_CLIENT_ID` | Votre Client ID (backend & frontend) |
| `PAYPAL_CLIENT_SECRET` | Votre Client Secret (backend) |
| `PAYPAL_MODE` | `sandbox` pour développement, `live` pour production |

### Compte de test PayPal
Pour tester les paiements, utilisez un compte sandbox PayPal :
- **Email** : Créer un compte test dans https://developer.paypal.com/dashboard/accounts
- **Mot de passe** : Définir lors de la création

### Webhooks (optionnel)
Les webhooks PayPal peuvent être configurés dans le Developer Dashboard pour recevoir des notifications de paiement en temps réel.
| `4000 0025 0000 3155` | Authentification 3D Secure requise |
| `4000 0000 0000 9995` | Fonds insuffisants |

---

## 🏗️ Architecture technique

### Backend (Stack)
- **Runtime** : Node.js 18+
- **Framework** : Express.js
- **Base de données** : MongoDB + Mongoose
- **Auth** : JWT + bcryptjs
- **Paiement** : Stripe (PaymentIntents + Webhooks)
- **Images** : Cloudinary (ou stockage local en dev)
- **IA** : OpenAI API (ou compatible)
- **Sécurité** : Helmet, CORS, Rate limiting, Mongo Sanitize

### Frontend (Stack)
- **Framework** : React 18
- **État global** : Redux Toolkit + localStorage persistence
- **Router** : React Router v6
- **Paiement** : @stripe/react-stripe-js (PaymentElement)
- **Requêtes API** : Axios avec intercepteur JWT
- **Notifications** : react-hot-toast
- **Icônes** : react-icons (Feather)
- **Fonts** : Playfair Display + DM Sans (Google Fonts)

---

## 👥 Rôles utilisateurs

| Rôle | Accès | Routes dashboard |
|------|-------|-----------------|
| **Acheteur** | Navigation, achat, favoris, avis | `/account/*` |
| **Vendeur** | Produits, commandes, IA | `/vendor/*` |
| **Admin** | Tout + paiements, validation vendeurs | `/admin/*` |

---

## 🛣️ Endpoints API principaux

| Module | Base URL | Description |
|--------|----------|-------------|
| Auth | `/api/auth` | Inscription, connexion, profil |
| Produits | `/api/products` | CRUD + recherche + filtres |
| Commandes | `/api/orders` | Cycle de vie complet |
| **Paiement** | `/api/payment` | **Stripe intégration complète** |
| Livraison | `/api/deliveries` | Simulation + tracking |
| IA | `/api/ai` | 5 outils de génération |
| Avis | `/api/products/:id/reviews` | Notes et commentaires |
| Favoris | `/api/favorites` | Wishlist acheteur |
| Catégories | `/api/categories` | CRUD admin |
| Vendeur | `/api/vendor` | Dashboard stats |
| Admin | `/api/admin` | Gestion plateforme |

### Endpoints Stripe détaillés

```
POST /api/payment/create-intent   → Créer PaymentIntent + ordre pending
POST /api/payment/confirm         → Confirmer paiement + activer commande
POST /api/payment/webhook         → Webhook Stripe (signature vérifiée)
POST /api/payment/refund/:orderId → Rembourser (acheteur ou admin)
GET  /api/payment/status/:orderId → Statut live depuis Stripe
```

---

## 🧪 Comptes de test

Après `npm run seed` dans le backend :

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@marketplace.ma | Admin@123 |
| Vendeur | vendor@marketplace.ma | Vendor@123 |
| Acheteur | buyer@marketplace.ma | Buyer@123 |

---

## 🗃️ Collections MongoDB

| Collection | Rôle |
|-----------|------|
| `users` | Acheteurs, vendeurs, admins |
| `products` | Produits avec images, SEO, multilangue |
| `orders` | Commandes avec statuts + données Stripe |
| `deliveries` | Livraisons simulées + timeline |
| `reviews` | Avis avec mise à jour auto du rating |
| `favorites` | Wishlist acheteurs |
| `categories` | Catégories hiérarchiques |
| `aigenerations` | Historique générations IA |

---

## 📦 Scripts disponibles

### Backend
```bash
npm run dev    # Nodemon — redémarrage auto
npm start      # Production
npm run seed   # Remplir la base avec données de test
```

### Frontend
```bash
npm start      # Dev server (port 3000)
npm run build  # Build production
```

---

## 🔐 Sécurité

- Mots de passe hashés avec **bcryptjs** (salt 12)
- Tokens **JWT** stateless, expirés en 7 jours
- Headers HTTP sécurisés avec **Helmet**
- Protection injection NoSQL avec **express-mongo-sanitize**
- Rate limiting : 200 req/15min (10 pour auth)
- CORS restreint à `CLIENT_URL`
- Webhook Stripe signé et vérifié avec `STRIPE_WEBHOOK_SECRET`

---

## 💡 Notes importantes

### Devise
Stripe ne supporte pas le MAD (Dirham marocain) nativement. Le backend facture en **EUR** avec un taux de change approximatif (1 EUR ≈ 10.8 MAD). Pour un déploiement production au Maroc, utilisez **CMI** (Centre Monétique Interbancaire) ou **PayZone**.

### Images
Sans Cloudinary configuré, les images sont stockées dans `uploads/` en local. En production, configurez Cloudinary pour un stockage persistant.

### IA
Sans `AI_API_KEY`, les endpoints `/api/ai` retournent une erreur. L'API est compatible avec tout service respectant le format OpenAI (`/v1/chat/completions`).
