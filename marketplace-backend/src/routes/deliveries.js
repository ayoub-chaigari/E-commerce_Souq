const express = require('express');
const router = express.Router();
const {
  getDeliveryByOrder, trackDelivery, updateDeliveryStatus, calculateFee,
} = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/auth');

router.post('/calculate-fee', calculateFee);
router.get('/track/:trackingNumber', trackDelivery);

router.use(protect);
router.get('/order/:orderId', getDeliveryByOrder);
router.put('/:id/status', authorize('vendor', 'admin'), updateDeliveryStatus);

module.exports = router;
