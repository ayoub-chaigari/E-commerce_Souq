const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { protect, authorize, requireApprovedVendor } = require('../middleware/auth');
const { sendSuccess } = require('../utils/response');

router.use(protect, authorize('vendor'), requireApprovedVendor);

// @desc    Get vendor dashboard stats
// @route   GET /api/vendor/dashboard
// @access  Vendor
router.get('/dashboard', async (req, res, next) => {
  try {
    const vendorId = req.user.id;

    const [
      totalProducts, activeProducts, totalOrders,
      recentOrders, revenue, lowStockProducts, topProducts,
    ] = await Promise.all([
      Product.countDocuments({ vendor: vendorId }),
      Product.countDocuments({ vendor: vendorId, isActive: true }),
      Order.countDocuments({ 'items.vendor': vendorId }),
      Order.find({ 'items.vendor': vendorId })
        .populate('buyer', 'name')
        .sort('-createdAt')
        .limit(5),
      Order.aggregate([
        { $match: { 'items.vendor': req.user._id, status: 'delivered' } },
        { $unwind: '$items' },
        { $match: { 'items.vendor': req.user._id } },
        { $group: { _id: null, total: { $sum: '$items.subtotal' }, count: { $sum: '$items.quantity' } } },
      ]),
      Product.find({ vendor: vendorId, stock: { $lte: 5 }, isActive: true })
        .select('name stock price')
        .limit(5),
      Product.find({ vendor: vendorId })
        .select('name totalSold rating price')
        .sort('-totalSold')
        .limit(5),
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: { 'items.vendor': req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    sendSuccess(res, 200, 'Dashboard retrieved.', {
      stats: {
        products: { total: totalProducts, active: activeProducts },
        orders: {
          total: totalOrders,
          byStatus: ordersByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        },
        revenue: revenue[0]?.total || 0,
        unitsSold: revenue[0]?.count || 0,
      },
      recentOrders,
      lowStockProducts,
      topProducts,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
