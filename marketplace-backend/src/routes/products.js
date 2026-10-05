const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, getProductBySlug, createProduct,
  updateProduct, deleteProduct, getMyProducts, deleteProductImage,
} = require('../controllers/productController');
const { protect, authorize, requireApprovedVendor } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Public routes
router.get('/', getProducts);
router.get('/slug/:slug', getProductBySlug);

// Vendor routes
router.get('/my-products', protect, authorize('vendor'), getMyProducts);
router.post(
  '/',
  protect,
  authorize('vendor'),
  requireApprovedVendor,
  upload.array('images', 5),
  createProduct
);

// Product-specific routes
router.get('/:id', getProduct);
router.put(
  '/:id',
  protect,
  authorize('vendor', 'admin'),
  upload.array('images', 5),
  updateProduct
);
router.delete('/:id', protect, authorize('vendor', 'admin'), deleteProduct);
router.delete(
  '/:id/images/:imageId',
  protect,
  authorize('vendor', 'admin'),
  deleteProductImage
);

// Reviews sub-router (mounted here for RESTful design)
const reviewRouter = require('./reviews');
router.use('/:productId/reviews', reviewRouter);

module.exports = router;
