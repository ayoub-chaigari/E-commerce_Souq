const express = require('express');
const router = express.Router();
const {
  createOrder, getMyOrders, getOrder, updateOrderStatus,
  getVendorOrders, getAllOrders, cancelOrder,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('buyer'), createOrder);
router.get('/my-orders', authorize('buyer'), getMyOrders);
router.put('/:id/cancel', authorize('buyer'), cancelOrder);

router.get('/vendor', authorize('vendor'), getVendorOrders);
router.put('/:id/status', authorize('vendor', 'admin'), updateOrderStatus);

router.get('/', authorize('admin'), getAllOrders);
router.get('/:id', getOrder); // all roles, filtered inside

module.exports = router;
