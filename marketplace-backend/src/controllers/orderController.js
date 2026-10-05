const Order = require('../models/Order');
const Product = require('../models/Product');
const Delivery = require('../models/Delivery');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// @desc    Create order
// @route   POST /api/orders
// @access  Buyer
exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, notes } = req.body;

    if (!items?.length) return sendError(res, 400, 'No items in order.');

    // Validate products and build order items
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return sendError(res, 400, `Product "${item.product}" not found or unavailable.`);
      }
      if (product.stock < item.quantity) {
        return sendError(res, 400, `Insufficient stock for "${product.name}". Available: ${product.stock}`);
      }

      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;

      orderItems.push({
        product: product._id,
        vendor: product.vendor,
        name: product.name,
        image: product.images[0]?.url || '',
        price: product.price,
        quantity: item.quantity,
        subtotal: lineTotal,
      });
    }

    // Calculate shipping fee
    const shippingFee = Delivery.calculateShippingFee(shippingAddress.city);
    const total = subtotal + shippingFee;

    // Create order
    const order = await Order.create({
      buyer: req.user.id,
      items: orderItems,
      shippingAddress,
      pricing: { subtotal, shippingFee, total },
      notes,
      estimatedDelivery: Delivery.estimateDeliveryDate(shippingAddress.city),
    });

    // Deduct stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Create delivery record
    const delivery = await Delivery.create({
      order: order._id,
      buyer: req.user.id,
      estimatedDeliveryDate: order.estimatedDelivery,
      deliveryAddress: shippingAddress,
      shippingFee,
      deliveryAgent: {
        name: 'Youssef Alaoui',
        phone: '+212 6XX-XXXXXX',
      },
      timeline: [{ status: 'pending', description: 'Order received', location: 'Warehouse' }],
    });

    await Order.findByIdAndUpdate(order._id, { delivery: delivery._id });

    sendSuccess(res, 201, 'Order placed successfully.', {
      order: { ...order.toObject(), delivery },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get buyer's orders
// @route   GET /api/orders/my-orders
// @access  Buyer
exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { buyer: req.user.id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('items.product', 'name images')
      .populate('delivery')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    sendPaginated(res, orders, total, Number(page), Number(limit));
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Buyer (own) | Vendor (own items) | Admin
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email phone')
      .populate('items.product', 'name images slug')
      .populate('items.vendor', 'name vendorInfo.shopName')
      .populate('delivery');

    if (!order) return sendError(res, 404, 'Order not found.');

    const isBuyer = order.buyer._id.toString() === req.user.id;
    const isVendor =
      req.user.role === 'vendor' &&
      order.items.some((i) => i.vendor._id?.toString() === req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isVendor && !isAdmin) {
      return sendError(res, 403, 'Not authorized to view this order.');
    }

    sendSuccess(res, 200, 'Order retrieved.', { order });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Vendor | Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return sendError(res, 400, `Invalid status. Valid: ${validStatuses.join(', ')}`);
    }

    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, 404, 'Order not found.');

    // Vendors can only update their own items' orders
    if (req.user.role === 'vendor') {
      const isVendorOrder = order.items.some(
        (i) => i.vendor.toString() === req.user.id
      );
      if (!isVendorOrder) return sendError(res, 403, 'Not authorized.');
    }

    order.status = status;
    order.statusHistory.push({ status, note, updatedBy: req.user.id });

    // Set timestamps
    const timestamps = {
      confirmed: 'confirmedAt',
      shipped: 'shippedAt',
      delivered: 'deliveredAt',
      cancelled: 'cancelledAt',
    };
    if (timestamps[status]) order[timestamps[status]] = new Date();
    if (status === 'cancelled' && req.body.cancelReason) {
      order.cancelReason = req.body.cancelReason;
    }

    // On delivery, mark payment as paid and update product sold counts
    if (status === 'delivered') {
      order.paymentStatus = 'paid';
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { totalSold: item.quantity },
        });
      }
    }

    await order.save();

    // Update delivery status
    if (order.delivery) {
      const deliveryStatusMap = {
        confirmed: 'picked_up',
        preparing: 'in_transit',
        shipped: 'out_for_delivery',
        delivered: 'delivered',
        cancelled: 'returned',
      };
      const deliveryStatus = deliveryStatusMap[status];
      if (deliveryStatus) {
        await Delivery.findByIdAndUpdate(order.delivery, {
          status: deliveryStatus,
          $push: {
            timeline: {
              status: deliveryStatus,
              description: note || `Order ${status}`,
              location: 'Morocco',
            },
          },
          ...(status === 'delivered' && { actualDeliveryDate: new Date() }),
        });
      }
    }

    sendSuccess(res, 200, 'Order status updated.', { order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor orders
// @route   GET /api/orders/vendor
// @access  Vendor
exports.getVendorOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { 'items.vendor': req.user.id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('buyer', 'name email phone')
      .populate('items.product', 'name images')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    sendPaginated(res, orders, total, Number(page), Number(limit));
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Admin
exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = status ? { status } : {};

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('buyer', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    sendPaginated(res, orders, total, Number(page), Number(limit));
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order (buyer)
// @route   PUT /api/orders/:id/cancel
// @access  Buyer
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, buyer: req.user.id });
    if (!order) return sendError(res, 404, 'Order not found.');

    if (!['pending', 'confirmed'].includes(order.status)) {
      return sendError(res, 400, 'Cannot cancel order at this stage.');
    }

    order.status = 'cancelled';
    order.cancelReason = req.body.reason || 'Cancelled by buyer';
    order.cancelledAt = new Date();
    order.statusHistory.push({ status: 'cancelled', note: order.cancelReason });

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    await order.save();
    sendSuccess(res, 200, 'Order cancelled.', { order });
  } catch (error) {
    next(error);
  }
};
