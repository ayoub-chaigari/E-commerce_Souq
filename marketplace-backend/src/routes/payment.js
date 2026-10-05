const express = require('express');
const router  = express.Router();
const {
  createPayment,
  executePayment,
  handleWebhook,
  refundPayment,
  getPaymentStatus,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// ── Stripe Webhook ─────────────────────────────────────────────────────────
// IMPORTANT: must use express.raw() — NOT express.json() — so Stripe can verify signature
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

// ── Protected routes ───────────────────────────────────────────────────────
router.use(protect);

router.post('/create-payment', authorize('buyer'), createPayment);
router.post('/execute',        authorize('buyer'), executePayment);
router.post('/refund/:orderId', refundPayment); // buyer (own) or admin
router.get('/status/:orderId',  getPaymentStatus);

module.exports = router;
