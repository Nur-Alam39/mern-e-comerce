const express = require('express');
const router = express.Router();
const sliderCtrl = require('../controllers/sliderController');
const upload = require('../middleware/upload');
const { protect, admin } = require('../middleware/auth');

// Public
router.get('/', sliderCtrl.getSliders);

// Admin
router.post('/', protect, admin, upload.single('image'), sliderCtrl.createSlider);
router.put('/:id', protect, admin, upload.single('image'), sliderCtrl.updateSlider);
router.delete('/:id', protect, admin, sliderCtrl.deleteSlider);

module.exports = router;
