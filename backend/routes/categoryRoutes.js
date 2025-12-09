const express = require('express');
const router = express.Router();
const catCtrl = require('../controllers/categoryController');
const upload = require('../middleware/upload');
const { protect, admin } = require('../middleware/auth');

router.get('/', catCtrl.getCategories);
router.post('/', protect, admin, upload.single('image'), catCtrl.createCategory);
router.put('/:id', protect, admin, upload.single('image'), catCtrl.updateCategory);
router.delete('/:id', protect, admin, catCtrl.deleteCategory);

module.exports = router;
