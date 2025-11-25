const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productVariationController');
const { protect, admin } = require('../middleware/auth');

router.get('/:productId', ctrl.getVariations);
router.post('/:productId', protect, admin, ctrl.createVariation);
router.put('/:id', protect, admin, ctrl.updateVariation);
router.delete('/:id', protect, admin, ctrl.deleteVariation);

module.exports = router;
