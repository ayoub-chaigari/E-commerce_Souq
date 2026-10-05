const Product = require('../models/Product');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// @desc    Get all products (with filters)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const {
      search, category, vendor, minPrice, maxPrice,
      sort = '-createdAt', page = 1, limit = 12,
      inStock, featured,
    } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }
    if (category) query.category = category;
    if (vendor) query.vendor = vendor;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (inStock === 'true') query.stock = { $gt: 0 };
    if (featured === 'true') query.isFeatured = true;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate('vendor', 'name vendorInfo.shopName vendorInfo.rating')
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    sendPaginated(res, products, total, Number(page), Number(limit));
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendor', 'name vendorInfo.shopName vendorInfo.rating vendorInfo.isApproved')
      .populate('category', 'name slug');

    if (!product || !product.isActive) {
      return sendError(res, 404, 'Product not found.');
    }

    sendSuccess(res, 200, 'Product retrieved.', { product });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product by slug
// @route   GET /api/products/slug/:slug
// @access  Public
exports.getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('vendor', 'name vendorInfo.shopName vendorInfo.rating')
      .populate('category', 'name slug');

    if (!product) return sendError(res, 404, 'Product not found.');
    sendSuccess(res, 200, 'Product retrieved.', { product });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Vendor
exports.createProduct = async (req, res, next) => {
  try {
    const images = req.files
      ? req.files.map((file, i) => ({
          url: file.path || `/uploads/${file.filename}`,
          publicId: file.filename,
          isPrimary: i === 0,
        }))
      : [];

    const product = await Product.create({
      ...req.body,
      vendor: req.user.id,
      images,
      tags: req.body.tags ? req.body.tags.split(',').map((t) => t.trim()) : [],
    });

    sendSuccess(res, 201, 'Product created successfully.', { product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Vendor (own) | Admin
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) return sendError(res, 404, 'Product not found.');

    if (req.user.role !== 'admin' && product.vendor.toString() !== req.user.id) {
      return sendError(res, 403, 'Not authorized to update this product.');
    }

    if (req.files?.length > 0) {
      const newImages = req.files.map((file, i) => ({
        url: file.path || `/uploads/${file.filename}`,
        publicId: file.filename,
        isPrimary: i === 0 && product.images.length === 0,
      }));
      req.body.images = [...(product.images || []), ...newImages];
    }

    if (req.body.tags && typeof req.body.tags === 'string') {
      req.body.tags = req.body.tags.split(',').map((t) => t.trim());
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    sendSuccess(res, 200, 'Product updated.', { product });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (soft delete)
// @route   DELETE /api/products/:id
// @access  Vendor (own) | Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 404, 'Product not found.');

    if (req.user.role !== 'admin' && product.vendor.toString() !== req.user.id) {
      return sendError(res, 403, 'Not authorized to delete this product.');
    }

    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    sendSuccess(res, 200, 'Product deleted.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor's own products
// @route   GET /api/products/my-products
// @access  Vendor
exports.getMyProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { vendor: req.user.id };
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    sendPaginated(res, products, total, Number(page), Number(limit));
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Vendor
exports.deleteProductImage = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 404, 'Product not found.');

    if (product.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 403, 'Not authorized.');
    }

    product.images = product.images.filter(
      (img) => img._id.toString() !== req.params.imageId
    );
    await product.save();

    sendSuccess(res, 200, 'Image deleted.', { product });
  } catch (error) {
    next(error);
  }
};
