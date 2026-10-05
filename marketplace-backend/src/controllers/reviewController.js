const Review = require('../models/Review');
const Order = require('../models/Order');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// @desc    Get reviews for a product
// @route   GET /api/products/:productId/reviews
// @access  Public
exports.getProductReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = { product: req.params.productId, isApproved: true };
    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('buyer', 'name avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    sendPaginated(res, reviews, total, Number(page), Number(limit));
  } catch (error) {
    next(error);
  }
};

// @desc    Create review
// @route   POST /api/products/:productId/reviews
// @access  Buyer
exports.createReview = async (req, res, next) => {
  try {
    const { rating, title, comment, orderId } = req.body;

    // Check if already reviewed
    const existing = await Review.findOne({
      product: req.params.productId,
      buyer: req.user.id,
    });
    if (existing) return sendError(res, 400, 'You have already reviewed this product.');

    // Check if verified purchase
    let isVerifiedPurchase = false;
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        buyer: req.user.id,
        'items.product': req.params.productId,
        status: 'delivered',
      });
      if (order) isVerifiedPurchase = true;
    }

    const review = await Review.create({
      product: req.params.productId,
      buyer: req.user.id,
      order: orderId || undefined,
      rating,
      title,
      comment,
      isVerifiedPurchase,
    });

    await review.populate('buyer', 'name avatar');
    sendSuccess(res, 201, 'Review submitted.', { review });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Buyer (own)
exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, buyer: req.user.id });
    if (!review) return sendError(res, 404, 'Review not found.');

    const { rating, title, comment } = req.body;
    if (rating) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;

    await review.save();
    await Review.updateProductRating(review.product);

    sendSuccess(res, 200, 'Review updated.', { review });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Buyer (own) | Admin
exports.deleteReview = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, buyer: req.user.id };

    const review = await Review.findOne(query);
    if (!review) return sendError(res, 404, 'Review not found.');

    const productId = review.product;
    await review.remove();
    await Review.updateProductRating(productId);

    sendSuccess(res, 200, 'Review deleted.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews (admin)
// @route   GET /api/reviews
// @access  Admin
exports.getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Review.countDocuments();
    const reviews = await Review.find()
      .populate('buyer', 'name email')
      .populate('product', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    sendPaginated(res, reviews, total, Number(page), Number(limit));
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle review approval (admin)
// @route   PUT /api/reviews/:id/approve
// @access  Admin
exports.toggleApproval = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return sendError(res, 404, 'Review not found.');

    review.isApproved = !review.isApproved;
    await review.save();
    await Review.updateProductRating(review.product);

    sendSuccess(res, 200, `Review ${review.isApproved ? 'approved' : 'unapproved'}.`, { review });
  } catch (error) {
    next(error);
  }
};
