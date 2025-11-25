const User = require('../models/User');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email, isAdmin: !!user.isAdmin } });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.blocked) return res.status(403).json({ message: 'Your account is blocked' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, isAdmin: !!user.isAdmin } });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProfile = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  res.json(req.user);
};

exports.updateProfile = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { name, phone, email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    user.phone = phone || user.phone;
    // Don't allow changing email for now

    await user.save();
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.saveShippingAddress = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { name, phone, address, city, postalCode, country } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.shippingAddress = { name, phone, address, city, postalCode, country };
    await user.save();
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.saveBillingAddress = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { name, phone, address, city, postalCode, country } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.billingAddress = { name, phone, address, city, postalCode, country };
    await user.save();
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addSavedAddress = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { label, name, phone, address, city, postalCode, country } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.savedAddresses.push({ label, name, phone, address, city, postalCode, country });
    await user.save();
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeSavedAddress = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { addressId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.savedAddresses = user.savedAddresses.filter(a => a._id.toString() !== addressId);
    await user.save();
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    // pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const total = await Order.countDocuments({ user: req.user._id });
    const pages = Math.ceil(total / limit) || 1;

    const orders = await Order.find({ user: req.user._id })
      .populate('items.variationId')
      .sort({ createdAt: -1 }) // newest first
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    res.json({ orders, page, pages, total });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin endpoints
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isGuest: false }).select('-password').sort({ createdAt: -1 });
    // Add order count to each user
    const usersWithOrderCount = await Promise.all(
      users.map(async (user) => {
        const orderCount = await Order.countDocuments({ user: user._id });
        return { ...user.toObject(), orderCount };
      })
    );
    res.json(usersWithOrderCount);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const orderCount = await Order.countDocuments({ user: user._id });
    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(5);

    res.json({ user, orderCount, recentOrders: orders });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.blocked = !user.blocked;
    await user.save();
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};
