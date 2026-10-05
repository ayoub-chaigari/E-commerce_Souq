const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Get delivery by order ID
// @route   GET /api/deliveries/order/:orderId
// @access  Buyer (own) | Vendor | Admin
exports.getDeliveryByOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return sendError(res, 404, 'Order not found.');

    const isBuyer = order.buyer.toString() === req.user.id;
    const isVendor =
      req.user.role === 'vendor' &&
      order.items.some((i) => i.vendor.toString() === req.user.id);

    if (!isBuyer && !isVendor && req.user.role !== 'admin') {
      return sendError(res, 403, 'Not authorized.');
    }

    const delivery = await Delivery.findOne({ order: req.params.orderId });
    if (!delivery) return sendError(res, 404, 'Delivery not found.');

    sendSuccess(res, 200, 'Delivery retrieved.', { delivery });
  } catch (error) {
    next(error);
  }
};

// @desc    Track by tracking number (public)
// @route   GET /api/deliveries/track/:trackingNumber
// @access  Public
exports.trackDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findOne({
      trackingNumber: req.params.trackingNumber,
    }).populate('order', 'orderNumber status pricing.total');

    if (!delivery) return sendError(res, 404, 'Tracking number not found.');

    // Return limited info for public tracking
    sendSuccess(res, 200, 'Tracking info retrieved.', {
      tracking: {
        trackingNumber: delivery.trackingNumber,
        status: delivery.status,
        estimatedDeliveryDate: delivery.estimatedDeliveryDate,
        actualDeliveryDate: delivery.actualDeliveryDate,
        timeline: delivery.timeline,
        deliveryAddress: {
          city: delivery.deliveryAddress.city,
          country: delivery.deliveryAddress.country,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update delivery status (admin/vendor)
// @route   PUT /api/deliveries/:id/status
// @access  Admin | Vendor
exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const { status, description, location } = req.body;

    const validStatuses = [
      'pending', 'picked_up', 'in_transit',
      'out_for_delivery', 'delivered', 'failed', 'returned',
    ];
    if (!validStatuses.includes(status)) {
      return sendError(res, 400, `Invalid status. Valid: ${validStatuses.join(', ')}`);
    }

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return sendError(res, 404, 'Delivery not found.');

    delivery.status = status;
    delivery.timeline.push({
      status,
      description: description || `Status updated to ${status}`,
      location: location || 'Morocco',
    });

    if (status === 'delivered') {
      delivery.actualDeliveryDate = new Date();
    }

    await delivery.save();
    sendSuccess(res, 200, 'Delivery status updated.', { delivery });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate shipping fee
// @route   POST /api/deliveries/calculate-fee
// @access  Public
exports.calculateFee = async (req, res) => {
  const { city, weight } = req.body;
  const fee = Delivery.calculateShippingFee(city, weight);
  const estimatedDate = Delivery.estimateDeliveryDate(city);
  sendSuccess(res, 200, 'Shipping calculated.', {
    shippingFee: fee,
    estimatedDeliveryDate: estimatedDate,
    city,
  });
};
