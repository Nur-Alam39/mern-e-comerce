const express = require('express');
const router = express.Router();
const pageCtrl = require('../controllers/pageController');
const { protect, admin } = require('../middleware/auth');

// Public
router.get('/slug/:slug', pageCtrl.getPageBySlug);

// Admin
router.get('/', protect, admin, pageCtrl.getPages);
router.get('/:id', protect, admin, pageCtrl.getPageById);
router.post('/', protect, admin, pageCtrl.createPage);
router.put('/:id', protect, admin, pageCtrl.updatePage);
router.delete('/:id', protect, admin, pageCtrl.deletePage);

module.exports = router;