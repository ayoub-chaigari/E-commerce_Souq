const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

const sendTokenResponse = (user, statusCode, res, message) => {
  const token = user.getSignedJwtToken();
  const userObj = user.toObject();
  delete userObj.password;
  sendSuccess(res, statusCode, message, { token, user: userObj });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, shopName, shopDescription } = req.body;

    const allowedRoles = ['buyer', 'vendor'];
    if (role && !allowedRoles.includes(role)) {
      return sendError(res, 400, 'Invalid role. Choose buyer or vendor.');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 400, 'Email already registered.');
    }

    const userData = { name, email, password, role: role || 'buyer' };

    if (role === 'vendor') {
      if (!shopName) return sendError(res, 400, 'Shop name is required for vendors.');
      userData.vendorInfo = { shopName, shopDescription, isApproved: false };
    }

    const user = await User.create(userData);
    sendTokenResponse(user, 201, res, 'Account created successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Please provide email and password.');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    if (!user.isActive) {
      return sendError(res, 401, 'Account deactivated. Contact support.');
    }

    sendTokenResponse(user, 200, res, 'Login successful.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  sendSuccess(res, 200, 'User retrieved.', { user: req.user });
};

// @desc    Update profile
// @route   PUT /api/auth/me
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'address', 'avatar'];
    if (req.user.role === 'vendor') {
      allowedFields.push('vendorInfo.shopName', 'vendorInfo.shopDescription');
    }

    const updates = {};
    allowedFields.forEach((field) => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        if (req.body[parent]?.[child] !== undefined) {
          if (!updates[parent]) updates[parent] = {};
          updates[parent][child] = req.body[parent][child];
        }
      } else if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    sendSuccess(res, 200, 'Profile updated.', { user });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return sendError(res, 400, 'Current password is incorrect.');
    }

    user.password = newPassword;
    await user.save();

    sendSuccess(res, 200, 'Password changed successfully.');
  } catch (error) {
    next(error);
  }
};
