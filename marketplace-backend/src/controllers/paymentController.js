if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
  console.warn('⚠️  PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET not set — payment endpoints will return 503');
}
const paypal = require('@paypal/paypal-server-sdk');

// PayPal client configuration
let client;
let ordersController;
let paymentsController;
if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
  client = new paypal.Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: process.env.PAYPAL_CLIENT_ID,
      oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
    },
    environment: process.env.PAYPAL_MODE === 'live' ? 'Production' : 'Sandbox',
  });

  ordersController = new paypal.OrdersController(client);
  paymentsController = new paypal.PaymentsController(client);
}
const Order    = require('../models/Order');
const Product  = require('../models/Product');
const Delivery = require('../models/Delivery');
const { sendSuccess, sendError } = require('../utils/response');

// Guard: reject all payment requests if PayPal is not configured
const requirePayPal = (req, res, next) => {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET || !client) {
    return sendError(res, 503, 'PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in your .env file.');
  }
  next();
};

// ── Helpers ───────────────────────────────────────────────────────────────────

// PayPal works directly with MAD (Moroccan Dirham)
// No conversion needed for PayPal as it supports MAD
const toPayPalAmount = (mad) => ({
  currency: 'MAD',
  total: mad.toFixed(2),
});

// ── Create PayPal Order ─────────────────────────────────────────────────────
// @desc   Create a PayPal order for an order
// @route  POST /api/payment/create-payment
// @access Buyer
exports.createPayment = [requirePayPal, async (req, res, next) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!items?.length) return sendError(res, 400, 'No items provided.');

    // Validate products and calculate total
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive)
        return sendError(res, 400, `Product "${item.product}" not found or unavailable.`);
      if (product.stock < item.quantity)
        return sendError(res, 400, `Insufficient stock for "${product.name}".`);

      subtotal += product.price * item.quantity;
      validatedItems.push({
        product: product._id,
        vendor:  product.vendor,
        name:    product.name,
        image:   product.images?.[0]?.url || '',
        price:   product.price,
        quantity: item.quantity,
        subtotal: product.price * item.quantity,
      });
    }

    const shippingFee = Delivery.calculateShippingFee(shippingAddress?.city);
    const totalMAD = subtotal + shippingFee;

    // Create PayPal order
    const order = await ordersController.ordersCreate({
      body: {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'MAD',
            value: totalMAD.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'MAD',
                value: subtotal.toFixed(2),
              },
              shipping: {
                currency_code: 'MAD',
                value: shippingFee.toFixed(2),
              },
            },
          },
          items: validatedItems.map(item => ({
            name: item.name.substring(0, 127), // PayPal limit
            unit_amount: {
              currency_code: 'MAD',
              value: item.price.toFixed(2),
            },
            quantity: item.quantity.toString(),
            sku: item.product.toString(),
          })),
          shipping: {
            address: {
              address_line_1: shippingAddress.street,
              admin_area_2: shippingAddress.city,
              country_code: shippingAddress.country || 'MA',
              postal_code: shippingAddress.postalCode || '',
            },
          },
        }],
        application_context: {
          return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/success`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/cancel`,
        },
      },
      prefer: 'return=representation',
    });

    // Create a pending order immediately
    const dbOrder = await Order.create({
      buyer: req.user.id,
      items: validatedItems,
      shippingAddress,
      pricing: { subtotal, shippingFee, total: totalMAD },
      paymentMethod: 'paypal',
      paymentStatus: 'awaiting_payment',
      status: 'pending',
      paypal: {
        paymentId: order.result.id,
        amount: totalMAD,
        currency: 'MAD',
      },
      estimatedDelivery: Delivery.estimateDeliveryDate(shippingAddress?.city),
    });

    // Reserve stock
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Find approval URL
    const approvalUrl = order.result.links.find(link => link.rel === 'approve').href;

    sendSuccess(res, 201, 'PayPal order created.', {
      approvalUrl,
      paymentId: order.result.id,
      orderId: dbOrder._id,
      orderNumber: dbOrder.orderNumber,
      pricing: {
        subtotalMAD: subtotal,
        shippingMAD: shippingFee,
        totalMAD,
      },
    });
  } catch (error) {
    next(error);
  }
}];

// ── Capture PayPal Order ───────────────────────────────────────────────────
// @desc   Capture PayPal order after user approval
// @route  POST /api/payment/execute
// @access Buyer
exports.executePayment = [requirePayPal, async (req, res, next) => {
  try {
    const { paymentId, orderId } = req.body;

    if (!paymentId || !orderId)
      return sendError(res, 400, 'paymentId and orderId are required.');

    const order = await Order.findOne({ _id: orderId, buyer: req.user.id });
    if (!order) return sendError(res, 404, 'Order not found.');

    if (order.paymentMethod !== 'paypal')
      return sendError(res, 400, 'This order does not use PayPal payment.');

    if (order.paymentStatus === 'paid')
      return sendError(res, 400, 'Payment already completed.');

    // Capture the PayPal order
    const capture = await ordersController.ordersCapture({
      id: paymentId,
      body: {},
    });

    if (capture.result.status !== 'COMPLETED') {
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      order.cancelReason = `PayPal capture failed: ${capture.result.status}`;
      order.cancelledAt = new Date();
      await order.save();

      // Release stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }

      return sendError(res, 402, `Payment capture failed: ${capture.result.status}`);
    }

    // Payment successful
    const captureDetails = capture.result.purchase_units[0].payments.captures[0];

    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.paidAt = new Date();
    order.paypal.transactionId = captureDetails.id;
    order.paypal.receiptUrl = `https://www.paypal.com/activity/payment/${captureDetails.id}`;
    order.statusHistory.push({ status: 'confirmed', note: 'PayPal order captured' });

    // Create delivery record
    const delivery = await Delivery.create({
      order: order._id,
      buyer: req.user.id,
      estimatedDeliveryDate: order.estimatedDelivery,
      deliveryAddress: order.shippingAddress,
      shippingFee: order.pricing.shippingFee,
      deliveryAgent: { name: 'Youssef Alaoui', phone: '+212 6XX-XXXXXX' },
      timeline: [{ status: 'pending', description: 'Commande confirmée — paiement PayPal reçu', location: 'Entrepôt' }],
    });
    order.delivery = delivery._id;

    await order.save();

    sendSuccess(res, 200, 'Payment captured successfully.', {
      order: await order.populate(['delivery']),
      receiptUrl: order.paypal.receiptUrl,
    });
  } catch (error) {
    next(error);
  }
}];

// ── PayPal Webhook ────────────────────────────────────────────────────────────
// @desc   Handle PayPal webhook events
// @route  POST /api/payment/webhook
// @access Public (PayPal-signed)
exports.handleWebhook = async (req, res) => {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    return res.status(503).json({ error: 'PayPal not configured' });
  }

  // PayPal webhook verification would go here
  // For simplicity, we'll handle webhooks manually in this implementation

  const event = req.body;

  try {
    switch (event.event_type) {
      case 'PAYMENT.SALE.COMPLETED': {
        const saleId = event.resource.id;
        const order = await Order.findOne({ 'paypal.transactionId': saleId });
        if (order && order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          order.status = 'confirmed';
          order.paidAt = new Date();
          order.statusHistory.push({ status: 'confirmed', note: 'Webhook: PAYMENT.SALE.COMPLETED' });
          await order.save();
          console.log(`✅ Payment confirmed via webhook for order ${order.orderNumber}`);
        }
        break;
      }

      case 'PAYMENT.SALE.DENIED':
      case 'PAYMENT.SALE.REVERSED': {
        const saleId = event.resource.id;
        const order = await Order.findOne({ 'paypal.transactionId': saleId });
        if (order && order.paymentStatus === 'awaiting_payment') {
          order.paymentStatus = 'failed';
          order.status = 'cancelled';
          order.cancelReason = `PayPal payment ${event.event_type}`;
          order.cancelledAt = new Date();
          await order.save();

          // Release stock
          for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
          }
          console.log(`❌ Payment failed via webhook for order ${order.orderNumber}`);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event.event_type}`);
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  res.json({ received: true });
};

// ── Refund ────────────────────────────────────────────────────────────────────
// @desc   Issue a full or partial refund
// @route  POST /api/payment/refund/:orderId
// @access Buyer (own, only if eligible) | Admin
exports.refundPayment = [requirePayPal, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return sendError(res, 404, 'Order not found.');

    // Authorization: buyer can only refund own orders; admin can refund any
    if (req.user.role !== 'admin' && order.buyer.toString() !== req.user.id)
      return sendError(res, 403, 'Not authorized.');

    if (order.paymentMethod !== 'paypal')
      return sendError(res, 400, 'Refunds are only available for PayPal payments.');

    if (order.paymentStatus !== 'paid')
      return sendError(res, 400, `Cannot refund order with payment status: ${order.paymentStatus}.`);

    if (!order.paypal?.transactionId)
      return sendError(res, 400, 'No transaction ID found for this order.');

    // Eligible statuses for refund
    if (!['pending', 'confirmed', 'cancelled'].includes(order.status) && req.user.role !== 'admin')
      return sendError(res, 400, 'Order cannot be refunded at this stage. Contact support.');

    // PayPal refund - full refund for simplicity
    const refund = await paymentsController.capturesRefund({
      captureId: order.paypal.transactionId,
      body: {
        amount: {
          value: order.paypal.amount.toFixed(2),
          currency_code: order.paypal.currency,
        },
      },
    });

    order.paymentStatus = 'refunded';
    order.status = 'cancelled';
    order.refundedAt = new Date();
    order.cancelReason = `Remboursement PayPal: ${refund.result.id}`;
    order.paypal.refundId = refund.result.id;
    order.statusHistory.push({ status: 'cancelled', note: `Remboursé via PayPal (${refund.result.id})` });

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    await order.save();

    sendSuccess(res, 200, 'Refund issued successfully.', {
      refundId: refund.result.id,
      amountRefunded: `${refund.result.amount.value} ${refund.result.amount.currency_code}`,
      status: refund.result.status,
    });
  } catch (error) {
    next(error);
  }
}];

// ── Get Payment Status ────────────────────────────────────────────────────────
// @desc   Get the current PayPal payment status for an order
// @route  GET /api/payment/status/:orderId
// @access Buyer (own) | Admin
exports.getPaymentStatus = [requirePayPal, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId).select('buyer paymentMethod paymentStatus paypal paidAt refundedAt orderNumber');
    if (!order) return sendError(res, 404, 'Order not found.');

    if (req.user.role !== 'admin' && order.buyer.toString() !== req.user.id)
      return sendError(res, 403, 'Not authorized.');

    if (order.paymentMethod !== 'paypal')
      return sendSuccess(res, 200, 'Payment info retrieved.', {
        method: 'cash_on_delivery',
        status: order.paymentStatus,
      });

    sendSuccess(res, 200, 'Payment info retrieved.', {
      orderNumber: order.orderNumber,
      method: 'paypal',
      status: order.paymentStatus,
      paidAt: order.paidAt,
      refundedAt: order.refundedAt,
      receiptUrl: order.paypal?.receiptUrl,
      paymentId: order.paypal?.paymentId,
      transactionId: order.paypal?.transactionId,
      refundId: order.paypal?.refundId,
      amountCharged: order.paypal?.amount ? `${order.paypal.amount} ${order.paypal.currency}` : null,
    });
  } catch (error) {
    next(error);
  }
}];
