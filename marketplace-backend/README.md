# 🛒 Marketplace Backend API

Backend complet pour une marketplace multi-vendeurs avec assistance IA, construit avec **Node.js**, **Express.js**, et **MongoDB**.

---

## 📁 Structure du Projet

```
marketplace-backend/
├── src/
│   ├── config/
│   │   ├── db.js                  # Connexion MongoDB
│   │   └── cloudinary.js          # Config upload images
│   ├── controllers/
│   │   ├── authController.js      # Inscription, connexion, profil
│   │   ├── productController.js   # CRUD produits
│   │   ├── orderController.js     # Gestion commandes
│   │   ├── reviewController.js    # Avis et notes
│   │   ├── favoriteController.js  # Favoris
│   │   ├── deliveryController.js  # Suivi livraison
│   │   ├── categoryController.js  # Catégories
│   │   ├── aiController.js        # Fonctionnalités IA
│   │   └── adminController.js     # Administration
│   ├── middleware/
│   │   ├── auth.js                # JWT + autorisation par rôle
│   │   └── errorHandler.js        # Gestion globale des erreurs
│   ├── models/
│   │   ├── User.js                # Acheteur / Vendeur / Admin
│   │   ├── Product.js             # Produits avec SEO et multilangue
│   │   ├── Order.js               # Commandes avec historique statuts
│   │   ├── Delivery.js            # Livraison simulée + tracking
│   │   ├── Review.js              # Avis avec mise à jour rating auto
│   │   ├── Favorite.js            # Favoris
│   │   ├── Category.js            # Catégories hiérarchiques
│   │   └── AIGeneration.js        # Historique des générations IA
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── reviews.js
│   │   ├── categories.js
│   │   ├── deliveries.js
│   │   ├── favorites.js
│   │   ├── ai.js
│   │   ├── admin.js
│   │   └── vendor.js
│   ├── utils/
│   │   ├── response.js            # Helpers de réponse JSON
│   │   └── seeder.js              # Script de seed BDD
│   └── server.js                  # Point d'entrée principal
├── uploads/                       # Images locales (dev)
├── .env.example
├── .gitignore
└── package.json
```

---

## 🚀 Installation & Démarrage

### 1. Cloner et installer
```bash
git clone <repo>
cd marketplace-backend
npm install
```

### 2. Configurer l'environnement
```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

### 3. Variables d'environnement (.env)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/marketplace
JWT_SECRET=votre_secret_jwt_tres_long
JWT_EXPIRE=7d

# Cloudinary (optionnel - fallback vers stockage local)
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# IA (OpenAI ou compatible)
AI_API_KEY=sk-xxx
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-3.5-turbo

CLIENT_URL=http://localhost:3000
```

### 4. Seeder la base de données (optionnel)
```bash
npm run seed
```
Crée 3 utilisateurs de test, 5 catégories, et 3 produits.

### 5. Démarrer
```bash
npm run dev    # Développement (nodemon)
npm start      # Production
```

---

## 🔑 Authentification

Toutes les routes protégées nécessitent un header :
```
Authorization: Bearer <token>
```

---

## 📌 Endpoints API

### 🔐 Auth — `/api/auth`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| POST | `/register` | Public | Inscription (buyer/vendor) |
| POST | `/login` | Public | Connexion |
| GET | `/me` | Privé | Profil courant |
| PUT | `/me` | Privé | Modifier profil |
| PUT | `/change-password` | Privé | Changer mot de passe |

**Register Buyer:**
```json
{
  "name": "Fatima Zahra",
  "email": "fatima@example.com",
  "password": "Password@123",
  "role": "buyer"
}
```

**Register Vendor:**
```json
{
  "name": "Mohammed Alami",
  "email": "vendor@example.com",
  "password": "Password@123",
  "role": "vendor",
  "shopName": "Boutique Alami",
  "shopDescription": "Produits artisanaux"
}
```

---

### 📦 Produits — `/api/products`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/` | Public | Liste avec filtres |
| GET | `/:id` | Public | Détail produit |
| GET | `/slug/:slug` | Public | Par slug SEO |
| GET | `/my-products` | Vendor | Mes produits |
| POST | `/` | Vendor | Créer (multipart/form-data) |
| PUT | `/:id` | Vendor/Admin | Modifier |
| DELETE | `/:id` | Vendor/Admin | Supprimer (soft) |
| DELETE | `/:id/images/:imageId` | Vendor/Admin | Supprimer image |

**Query params GET /products:**
```
?search=tajine&category=ID&minPrice=100&maxPrice=500
&sort=-price&page=1&limit=12&inStock=true&featured=true
```

**Créer un produit (form-data):**
```
name: Tajine en Poterie
description: Description complète...
price: 180
stock: 50
category: <category_id>
tags: tajine,poterie,artisanat
images: [file1, file2, ...]  (max 5)
```

---

### 🛍️ Commandes — `/api/orders`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| POST | `/` | Buyer | Passer commande |
| GET | `/my-orders` | Buyer | Mes commandes |
| PUT | `/:id/cancel` | Buyer | Annuler |
| GET | `/vendor` | Vendor | Commandes vendeur |
| PUT | `/:id/status` | Vendor/Admin | Changer statut |
| GET | `/` | Admin | Toutes les commandes |
| GET | `/:id` | Auth | Détail commande |

**Passer une commande:**
```json
{
  "items": [
    { "product": "<product_id>", "quantity": 2 },
    { "product": "<product_id>", "quantity": 1 }
  ],
  "shippingAddress": {
    "fullName": "Fatima Zahra",
    "phone": "+212 6XX-XXXXXX",
    "street": "123 Rue Hassan II",
    "city": "Casablanca",
    "postalCode": "20000",
    "country": "MA"
  },
  "notes": "Sonner deux fois"
}
```

**Statuts de commande (ordre):**
```
pending → confirmed → preparing → shipped → delivered
                                          ↘ cancelled
```

---

### 🚚 Livraison — `/api/deliveries`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| POST | `/calculate-fee` | Public | Calculer frais |
| GET | `/track/:trackingNumber` | Public | Suivre colis |
| GET | `/order/:orderId` | Auth | Livraison par commande |
| PUT | `/:id/status` | Vendor/Admin | Mettre à jour statut |

**Calculer frais:**
```json
{ "city": "Casablanca", "weight": 500 }
```

**Statuts livraison:**
```
pending → picked_up → in_transit → out_for_delivery → delivered
```

---

### ⭐ Avis — `/api/products/:productId/reviews`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/` | Public | Avis du produit |
| POST | `/` | Buyer | Ajouter avis |
| PUT | `/reviews/:id` | Buyer | Modifier son avis |
| DELETE | `/reviews/:id` | Buyer/Admin | Supprimer |
| GET | `/reviews/all` | Admin | Tous les avis |
| PUT | `/reviews/:id/approve` | Admin | Approuver/refuser |

**Ajouter un avis:**
```json
{
  "rating": 5,
  "title": "Excellent produit !",
  "comment": "Très bonne qualité, livraison rapide.",
  "orderId": "<order_id>"
}
```

---

### ❤️ Favoris — `/api/favorites`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/` | Buyer | Mes favoris |
| POST | `/:productId` | Buyer | Toggle favori |
| GET | `/:productId/check` | Buyer | Vérifier si favori |

---

### 🤖 IA — `/api/ai`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| POST | `/generate-description` | Vendor | Générer description |
| POST | `/generate-multilingual` | Vendor | FR + EN + AR |
| POST | `/generate-seo` | Vendor | Titre, meta, keywords |
| POST | `/suggest-price` | Vendor | Suggestion de prix |
| POST | `/improve-text` | Vendor | Améliorer texte |
| GET | `/history` | Vendor | Historique générations |

**Générer description:**
```json
{
  "productName": "Tajine en Poterie de Safi",
  "category": "Artisanat",
  "features": "Fait main, argile naturelle, diam. 30cm",
  "language": "FR",
  "productId": "<optional_product_id>"
}
```

**Générer multilingue:**
```json
{
  "productName": "Tajine en Poterie",
  "category": "Artisanat",
  "features": "Fait main, argile naturelle"
}
```
Retourne : `{ "FR": "...", "EN": "...", "AR": "..." }`

**SEO:**
```json
{
  "productName": "Tajine Safi",
  "description": "Tajine artisanal...",
  "category": "Artisanat"
}
```
Retourne : `{ seoTitle, seoDescription, seoKeywords[] }`

---

### 📊 Tableau de bord Vendeur — `/api/vendor`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/dashboard` | Vendor | Stats complètes |

Retourne : produits, commandes par statut, chiffre d'affaires, produits en rupture, top produits.

---

### 🏷️ Catégories — `/api/categories`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/` | Public | Toutes (ou `?tree=true`) |
| GET | `/:id` | Public | Une catégorie |
| POST | `/` | Admin | Créer |
| PUT | `/:id` | Admin | Modifier |
| DELETE | `/:id` | Admin | Désactiver |

---

### 🛡️ Admin — `/api/admin`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/stats` | Admin | Stats globales |
| GET | `/users` | Admin | Tous les utilisateurs |
| PUT | `/users/:id/toggle-status` | Admin | Activer/désactiver |
| GET | `/vendors/pending` | Admin | Vendeurs en attente |
| PUT | `/vendors/:id/approval` | Admin | Approuver/rejeter |
| GET | `/vendors/:id/stats` | Admin | Stats d'un vendeur |
| PUT | `/products/:id/feature` | Admin | Mettre en avant |

**Approuver un vendeur:**
```json
{ "approved": true }
```

---

## 🔐 Rôles & Permissions

| Fonctionnalité | Buyer | Vendor | Admin |
|---------------|-------|--------|-------|
| Parcourir produits | ✅ | ✅ | ✅ |
| Passer commande | ✅ | ❌ | ❌ |
| Gérer ses produits | ❌ | ✅ | ✅ |
| Utiliser l'IA | ❌ | ✅ | ❌ |
| Valider vendeurs | ❌ | ❌ | ✅ |
| Stats globales | ❌ | ❌ | ✅ |
| Ajouter favoris | ✅ | ❌ | ❌ |
| Laisser un avis | ✅ | ❌ | ❌ |

---

## 🗃️ Modèles MongoDB

### Résumé des collections
| Collection | Description |
|-----------|-------------|
| `users` | Acheteurs, vendeurs, admins |
| `products` | Produits avec images, SEO, stock |
| `orders` | Commandes avec historique statuts |
| `deliveries` | Livraisons simulées + timeline |
| `reviews` | Avis avec mise à jour auto du rating |
| `favorites` | Produits sauvegardés |
| `categories` | Catégories hiérarchiques |
| `aigenerations` | Historique des générations IA |

---

## 🛡️ Sécurité

- **JWT** : Authentification stateless
- **bcryptjs** : Hachage des mots de passe (salt 12)
- **Helmet** : Headers HTTP sécurisés
- **express-rate-limit** : 200 req/15min général, 10 req/15min pour auth
- **express-mongo-sanitize** : Protection NoSQL injection
- **CORS** : Origines contrôlées
- **Validation Mongoose** : Toutes les entrées validées

---

## 📦 Calcul des Frais de Livraison (Simulé)

| Ville | Frais de base |
|-------|--------------|
| Casablanca | 25 MAD |
| Rabat | 30 MAD |
| Marrakech / Fès | 35 MAD |
| Tanger / Agadir | 40 MAD |
| Autres villes | 50 MAD |

Supplément : +5 MAD par 500g au-delà de 1kg

**Délais estimés :**
- Casablanca, Rabat, Salé : 2 jours ouvrés
- Autres villes : 4 jours ouvrés

---

## 🧪 Comptes de Test (après seed)

```
Admin  : admin@marketplace.ma  / Admin@123
Vendor : vendor@marketplace.ma / Vendor@123
Buyer  : buyer@marketplace.ma  / Buyer@123
```
