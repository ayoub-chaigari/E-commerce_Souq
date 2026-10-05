require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

const seed = async () => {
  await connectDB();

  console.log('🌱 Seeding database...');

  // Clear existing
  await Promise.all([
    User.deleteMany(),
    Category.deleteMany(),
    Product.deleteMany(),
  ]);

  // Create users
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@marketplace.ma',
    password: 'Admin@123',
    role: 'admin',
  });

  const vendor = await User.create({
    name: 'Mohammed Alami',
    email: 'vendor@marketplace.ma',
    password: 'Vendor@123',
    role: 'vendor',
    vendorInfo: {
      shopName: 'Boutique Alami',
      shopDescription: 'Produits artisanaux marocains de qualité',
      isApproved: true,
      approvedAt: new Date(),
    },
  });

  const buyer = await User.create({
    name: 'Fatima Zahra',
    email: 'buyer@marketplace.ma',
    password: 'Buyer@123',
    role: 'buyer',
    phone: '+212 6XX-XXXXXX',
    address: { street: '123 Rue Hassan II', city: 'Casablanca', country: 'MA' },
  });

  // Create categories
  const categories = await Category.insertMany([
    { name: 'Électronique', description: 'Appareils et gadgets électroniques', order: 1 },
    { name: 'Mode', description: 'Vêtements et accessoires', order: 2 },
    { name: 'Maison & Jardin', description: 'Décoration et jardinage', order: 3 },
    { name: 'Artisanat', description: 'Produits artisanaux marocains', order: 4 },
    { name: 'Alimentation', description: 'Produits alimentaires et épicerie', order: 5 },
  ]);

  // Create products
  await Product.insertMany([
    {
      vendor: vendor._id,
      category: categories[0]._id,
      name: 'Smartphone Samsung Galaxy A54',
      description: 'Smartphone milieu de gamme avec excellent appareil photo 50MP et batterie 5000mAh.',
      price: 3499,
      stock: 25,
      images: [{ url: 'https://via.placeholder.com/800x800?text=Samsung+A54', isPrimary: true }],
      tags: ['smartphone', 'samsung', 'android'],
      rating: 4.3,
      numReviews: 12,
    },
    {
      vendor: vendor._id,
      category: categories[3]._id,
      name: 'Tajine en Poterie de Safi',
      description: 'Tajine authentique en poterie artisanale, fabriqué à Safi par des artisans locaux.',
      price: 180,
      stock: 50,
      images: [{ url: 'https://via.placeholder.com/800x800?text=Tajine', isPrimary: true }],
      tags: ['tajine', 'poterie', 'artisanat', 'safi'],
      rating: 4.8,
      numReviews: 34,
      isFeatured: true,
    },
    {
      vendor: vendor._id,
      category: categories[1]._id,
      name: 'Djellaba Homme Traditionelle',
      description: 'Djellaba homme en tissu de qualité, broderie traditionnelle marocaine.',
      price: 450,
      stock: 30,
      images: [{ url: 'https://via.placeholder.com/800x800?text=Djellaba', isPrimary: true }],
      tags: ['djellaba', 'vêtement', 'traditionnel'],
      rating: 4.5,
      numReviews: 8,
    },
  ]);

  console.log('✅ Seed complete!');
  console.log('\n📋 Test Credentials:');
  console.log('  Admin:  admin@marketplace.ma / Admin@123');
  console.log('  Vendor: vendor@marketplace.ma / Vendor@123');
  console.log('  Buyer:  buyer@marketplace.ma / Buyer@123\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
