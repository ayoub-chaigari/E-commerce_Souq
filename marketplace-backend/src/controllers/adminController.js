const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers, totalVendors, pendingVendors,
      totalProducts, totalOrders, totalRevenue,
      recentOrders, ordersByStatus,
    ] = await Promise.all([
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: 'vendor', 'vendorInfo.isApproved': true }),
      User.countDocuments({ role: 'vendor', 'vendorInfo.isApproved': false }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } },
      ]),
      Order.find().populate('buyer', 'name email').sort('-createdAt').limit(5),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    // Revenue per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Order.aggregate([
      { $match: { status: 'delivered', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$pricing.total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    sendSuccess(res, 200, 'Stats retrieved.', {
      stats: {
        users: { buyers: totalUsers, vendors: totalVendors, pendingVendors },
        products: totalProducts,
        orders: {
          total: totalOrders,
          byStatus: ordersByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          monthly: monthlyRevenue,
        },
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort('-createdAt').skip(skip).limit(Number(limit));

    sendPaginated(res, users, total, Number(page), Number(limit));
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Admin
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found.');
    if (user.role === 'admin') return sendError(res, 400, 'Cannot deactivate admin accounts.');

    user.isActive = !user.isActive;
    await user.save();

    sendSuccess(res, 200, `User ${user.isActive ? 'activated' : 'deactivated'}.`, { user });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject vendor
// @route   PUT /api/admin/vendors/:id/approval
// @access  Admin
exports.updateVendorApproval = async (req, res, next) => {
  try {
    const { approved } = req.body;
    const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
    if (!vendor) return sendError(res, 404, 'Vendor not found.');

    vendor.vendorInfo.isApproved = approved;
    if (approved) vendor.vendorInfo.approvedAt = new Date();
    await vendor.save();

    sendSuccess(res, 200, `Vendor ${approved ? 'approved' : 'rejected'}.`, { vendor });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending vendor approvals
// @route   GET /api/admin/vendors/pending
// @access  Admin
exports.getPendingVendors = async (req, res, next) => {
  try {
    const vendors = await User.find({
      role: 'vendor',
      'vendorInfo.isApproved': false,
    }).sort('-createdAt');

    sendSuccess(res, 200, 'Pending vendors retrieved.', { count: vendors.length, vendors });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle product featured status
// @route   PUT /api/admin/products/:id/feature
// @access  Admin
exports.toggleProductFeature = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 404, 'Product not found.');

    product.isFeatured = !product.isFeatured;
    await product.save();

    sendSuccess(res, 200, `Product ${product.isFeatured ? 'featured' : 'unfeatured'}.`, { product });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor stats (admin view)
// @route   GET /api/admin/vendors/:id/stats
// @access  Admin
exports.getVendorStats = async (req, res, next) => {
  try {
    const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
    if (!vendor) return sendError(res, 404, 'Vendor not found.');

    const [products, orders, revenue] = await Promise.all([
      Product.countDocuments({ vendor: req.params.id, isActive: true }),
      Order.countDocuments({ 'items.vendor': req.params.id }),
      Order.aggregate([
        { $match: { 'items.vendor': vendor._id, status: 'delivered' } },
        { $unwind: '$items' },
        { $match: { 'items.vendor': vendor._id } },
        { $group: { _id: null, total: { $sum: '$items.subtotal' } } },
      ]),
    ]);

    sendSuccess(res, 200, 'Vendor stats retrieved.', {
      vendor,
      stats: {
        products,
        orders,
        revenue: revenue[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
