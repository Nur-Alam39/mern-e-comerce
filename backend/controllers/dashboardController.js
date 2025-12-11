const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Category = require('../models/Category');
const Page = require('../models/Page');
const Slider = require('../models/Slider');

exports.getStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ isAdmin: { $ne: true } });
    const totalCategories = await Category.countDocuments();
    const totalPages = await Page.countDocuments();
    const totalSliders = await Slider.countDocuments();

    res.json({
      totalProducts,
      totalOrders,
      totalCustomers,
      totalCategories,
      totalPages,
      totalSliders
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};