const Favorite = require('../models/Favorite');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Get my favorites
// @route   GET /api/favorites
// @access  Buyer
exports.getMyFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ buyer: req.user.id })
      .populate({
        path: 'product',
        select: 'name price images rating numReviews stock slug',
        populate: { path: 'vendor', select: 'vendorInfo.shopName' },
      })
      .sort('-createdAt');

    // Filter out deleted products
    const valid = favorites.filter((f) => f.product && f.product.stock !== undefined);

    sendSuccess(res, 200, 'Favorites retrieved.', {
      count: valid.length,
      favorites: valid,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle favorite (add/remove)
// @route   POST /api/favorites/:productId
// @access  Buyer
exports.toggleFavorite = async (req, res, next) => {
  try {
    const existing = await Favorite.findOne({
      buyer: req.user.id,
      product: req.params.productId,
    });

    if (existing) {
      await existing.remove();
      return sendSuccess(res, 200, 'Removed from favorites.', { isFavorite: false });
    }

    await Favorite.create({ buyer: req.user.id, product: req.params.productId });
    sendSuccess(res, 201, 'Added to favorites.', { isFavorite: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if product is favorited
// @route   GET /api/favorites/:productId/check
// @access  Buyer
exports.checkFavorite = async (req, res, next) => {
  try {
    const favorite = await Favorite.findOne({
      buyer: req.user.id,
      product: req.params.productId,
    });
    sendSuccess(res, 200, 'Checked.', { isFavorite: !!favorite });
  } catch (error) {
    next(error);
  }
};
