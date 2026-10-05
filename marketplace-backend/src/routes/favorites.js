const express = require('express');
const router = express.Router();
const { getMyFavorites, toggleFavorite, checkFavorite } = require('../controllers/favoriteController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('buyer'));
router.get('/', getMyFavorites);
router.post('/:productId', toggleFavorite);
router.get('/:productId/check', checkFavorite);

module.exports = router;
