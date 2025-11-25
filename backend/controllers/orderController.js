const Order = require('../models/Order');
const Product = require('../models/Product');
const ProductVariation = require('../models/ProductVariation');

exports.createOrder = async (req, res) => {
  try {
    const { items, shippingInfo, paymentMethod, totalPrice } = req.body;

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }
    if (!shippingInfo || !shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
      return res.status(400).json({ message: 'Missing required shipping information' });
    }
    if (typeof totalPrice !== 'number' || totalPrice <= 0) {
      return res.status(400).json({ message: 'Invalid total price' });
    }

    // items: [{ product: id, qty, price, variationId? }]
    // Validate and reduce stock
    for (const it of items) {
      if (!it.product || !it.qty || !it.price) {
        return res.status(400).json({ message: 'Each item must have product ID, qty, and price' });
      }
      if (it.variationId) {
        const variation = await ProductVariation.findById(it.variationId);
        if (!variation) return res.status(400).json({ message: `Variation not found: ${it.variationId}` });
        if (variation.stock < it.qty) return res.status(400).json({ message: `Not enough stock for variation ${variation.size}` });
      } else {
        const p = await Product.findById(it.product);
        if (!p) return res.status(400).json({ message: `Product not found: ${it.product}` });
        if (p.stock < it.qty) return res.status(400).json({ message: `Not enough stock for ${p.name}` });
      }
    }
    // all good, reduce stock and prepare items with product name
    const preparedItems = [];
    for (const it of items) {
      let name, productData;
      if (it.variationId) {
        const variation = await ProductVariation.findById(it.variationId).populate('product');
        variation.stock = variation.stock - it.qty;
        await variation.save();
        name = `${variation.product.name} (${variation.size})`;
        productData = {
          _id: variation.product._id,
          name: variation.product.name,
          price: variation.product.price,
          discountedPrice: variation.product.discountedPrice
        };
      } else {
        const p = await Product.findById(it.product);
        p.stock = p.stock - it.qty;
        await p.save();
        name = p.name;
        productData = {
          _id: p._id,
          name: p.name,
          price: p.price,
          discountedPrice: p.discountedPrice
        };
      }
      preparedItems.push({
        product: productData,
        variationId: it.variationId,
        name,
        qty: it.qty,
        price: it.price
      });
    }
    const order = new Order({ user: req.user ? req.user._id : null, items: preparedItems, shippingInfo, paymentMethod: paymentMethod || 'Cash on Delivery', totalPrice });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user').populate('items.variationId');
    res.json(orders);
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

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.variationId');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // Allow if it's a guest order (user is null) or if logged in user owns it
    if (order.user && req.user && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(order);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.status = req.body.status || order.status;
    await order.save();
    res.json(order);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};
