const express = require('express');
const router = express.Router();
const orderCtrl = require('../controllers/orderController');
const { protect, admin, optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth, orderCtrl.createOrder); // allow guest orders if no token provided
router.get('/', protect, admin, orderCtrl.getOrders);
router.get('/myorders', protect, orderCtrl.getMyOrders);
router.get('/:id', optionalAuth, orderCtrl.getOrderById);
router.put('/:id/status', protect, admin, orderCtrl.updateOrderStatus);

module.exports = router;
