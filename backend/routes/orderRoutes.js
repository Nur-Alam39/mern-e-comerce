const express = require('express');
const router = express.Router();
const orderCtrl = require('../controllers/orderController');
const { protect, admin, optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth, orderCtrl.createOrder); // allow guest orders if no token provided
router.post('/ssl-success', orderCtrl.sslSuccess);
router.post('/ssl-fail', orderCtrl.sslFail);
router.post('/ssl-cancel', orderCtrl.sslCancel);
router.post('/ssl-ipn', orderCtrl.sslIpn);
router.get('/', protect, admin, orderCtrl.getOrders);
router.get('/myorders', protect, orderCtrl.getMyOrders);
router.get('/:id', optionalAuth, orderCtrl.getOrderById);
router.put('/:id/status', protect, admin, orderCtrl.updateOrderStatus);
router.post('/:id/items', protect, admin, orderCtrl.addItemToOrder);
router.delete('/:id/items', protect, admin, orderCtrl.removeItemFromOrder);
router.put('/:id/items', protect, admin, orderCtrl.updateItemQuantity);
router.put('/:id/address', protect, admin, orderCtrl.updateOrderAddress);

module.exports = router;
