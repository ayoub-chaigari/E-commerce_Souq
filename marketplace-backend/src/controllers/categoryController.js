const Category = require('../models/Category');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const { tree } = req.query;

    if (tree === 'true') {
      // Return hierarchical tree
      const parents = await Category.find({ parent: null, isActive: true })
        .populate({ path: 'subcategories', match: { isActive: true } })
        .sort('order');
      return sendSuccess(res, 200, 'Categories retrieved.', { categories: parents });
    }

    const categories = await Category.find({ isActive: true })
      .populate('parent', 'name slug')
      .sort('order name');

    sendSuccess(res, 200, 'Categories retrieved.', { categories });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id).populate('parent', 'name slug');
    if (!category) return sendError(res, 404, 'Category not found.');
    sendSuccess(res, 200, 'Category retrieved.', { category });
  } catch (error) {
    next(error);
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Admin
exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    sendSuccess(res, 201, 'Category created.', { category });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Admin
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) return sendError(res, 404, 'Category not found.');
    sendSuccess(res, 200, 'Category updated.', { category });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Admin
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!category) return sendError(res, 404, 'Category not found.');
    sendSuccess(res, 200, 'Category deleted.');
  } catch (error) {
    next(error);
  }
};
