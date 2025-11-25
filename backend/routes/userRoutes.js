const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

// Auth
router.post('/register', userCtrl.register);
router.post('/login', userCtrl.login);

// User profile (protected)
router.get('/profile', protect, userCtrl.getProfile);
router.put('/profile', protect, userCtrl.updateProfile);
router.post('/shipping-address', protect, userCtrl.saveShippingAddress);
router.post('/billing-address', protect, userCtrl.saveBillingAddress);
router.post('/saved-addresses', protect, userCtrl.addSavedAddress);
router.delete('/saved-addresses', protect, userCtrl.removeSavedAddress);
router.get('/orders', protect, userCtrl.getMyOrders);

// Admin only
router.get('/admin/users', protect, admin, userCtrl.getAllUsers);
router.get('/admin/users/:id', protect, admin, userCtrl.getUserProfile);
router.put('/admin/users/:id/block', protect, admin, userCtrl.blockUser);

module.exports = router;
