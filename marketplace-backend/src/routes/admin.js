const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getAllUsers, toggleUserStatus,
  updateVendorApproval, getPendingVendors,
  toggleProductFeature, getVendorStats,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);

router.get('/vendors/pending', getPendingVendors);
router.put('/vendors/:id/approval', updateVendorApproval);
router.get('/vendors/:id/stats', getVendorStats);

router.put('/products/:id/feature', toggleProductFeature);

module.exports = router;
