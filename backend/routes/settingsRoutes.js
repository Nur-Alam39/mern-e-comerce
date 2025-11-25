const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', ctrl.getSettings);
router.put('/', protect, admin, upload.single('brandLogo'), ctrl.updateSettings);
router.put('/payment/:methodName', protect, admin, upload.single('logo'), ctrl.updatePaymentMethod);
router.put('/couriers/:name', protect, admin, ctrl.updateCourierProvider);

module.exports = router;
