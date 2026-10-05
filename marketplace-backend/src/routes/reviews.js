const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams for productId
const {
  getProductReviews, createReview, updateReview,
  deleteReview, getAllReviews, toggleApproval,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

// Mounted at /api/products/:productId/reviews
router.get('/', getProductReviews);
router.post('/', protect, authorize('buyer'), createReview);

// Standalone review routes (also mounted at /api/reviews)
router.get('/all', protect, authorize('admin'), getAllReviews);
router.put('/:id', protect, authorize('buyer'), updateReview);
router.delete('/:id', protect, authorize('buyer', 'admin'), deleteReview);
router.put('/:id/approve', protect, authorize('admin'), toggleApproval);

module.exports = router;
