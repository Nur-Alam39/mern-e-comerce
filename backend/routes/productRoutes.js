const express = require('express');
const router = express.Router();
const productCtrl = require('../controllers/productController');
const upload = require('../middleware/upload');
const { protect, admin } = require('../middleware/auth');

// Public
router.get('/', productCtrl.getProducts);
router.get('/:id', productCtrl.getProductById);

// Admin
router.post('/', protect, admin, upload.array('images', 8), productCtrl.createProduct);
router.put('/:id', protect, admin, upload.array('images', 8), productCtrl.updateProduct);
router.delete('/:id', protect, admin, productCtrl.deleteProduct);

module.exports = router;
