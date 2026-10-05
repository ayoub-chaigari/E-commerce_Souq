const express = require('express');
const router = express.Router();
const {
  generateDescription, generateMultilingual, generateSEO,
  suggestPrice, improveText, getHistory,
} = require('../controllers/aiController');
const { protect, authorize, requireApprovedVendor } = require('../middleware/auth');

router.use(protect, authorize('vendor'), requireApprovedVendor);

router.post('/generate-description', generateDescription);
router.post('/generate-multilingual', generateMultilingual);
router.post('/generate-seo', generateSEO);
router.post('/suggest-price', suggestPrice);
router.post('/improve-text', improveText);
router.get('/history', getHistory);

module.exports = router;
