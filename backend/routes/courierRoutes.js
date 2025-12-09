const express = require('express');
const router = express.Router();
const { quote, create, bulkCreate, getStatus, getShipment, webhook } = require('../controllers/courierController');
const { protect, admin, optionalAuth } = require('../middleware/auth');

// public quote (optional auth)
router.post('/quote', optionalAuth, quote);

// create shipment (admin only)
router.post('/create', protect, admin, create);

// bulk create shipments (admin only)
router.post('/bulk-create', protect, admin, bulkCreate);

// get shipment status (admin only)
router.post('/status', protect, admin, getStatus);

// get shipment(s) - supports query ?orderId=... or /:id
router.get('/', protect, admin, getShipment);
router.get('/:id', protect, admin, getShipment);

// webhook endpoint (public, secure by provider secret if configured)
router.post('/webhook', webhook);

module.exports = router;
