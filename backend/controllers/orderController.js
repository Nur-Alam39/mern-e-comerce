const Order = require('../models/Order');
const Product = require('../models/Product');
const ProductVariation = require('../models/ProductVariation');
const Settings = require('../models/Settings');
const sslCommerzService = require('../services/sslCommerzService');

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

    if (paymentMethod === 'ssl_commerce') {
      await order.save(); // Save order first

      try {
        const paymentResult = await sslCommerzService.initiatePayment({
          totalPrice,
          orderId: order._id.toString(),
          protocol: req.protocol,
          host: req.get('host'),
          productNames: preparedItems.map(it => it.name).join(', '),
          customerName: shippingInfo.name,
          customerEmail: shippingInfo.email,
          customerAddress: shippingInfo.address,
          customerCity: shippingInfo.city,
          customerPostcode: shippingInfo.postalCode,
          customerCountry: shippingInfo.country,
          customerPhone: shippingInfo.phone
        });

        if (paymentResult.success) {
          res.status(200).json({ gatewayUrl: paymentResult.gatewayUrl, orderId: order._id });
        } else {
          await Order.findByIdAndUpdate(order._id, { status: 'Payment Failed' });
          res.status(400).json({ message: paymentResult.error });
        }
      } catch (error) {
        console.error('SSL Commerz API error:', error);
        await Order.findByIdAndUpdate(order._id, { status: 'Payment Failed' });
        res.status(500).json({ message: 'Payment gateway error' });
      }
    } else {
      await order.save();
      res.status(201).json(order);
    }
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

// SSL Commerz handlers
exports.sslSuccess = async (req, res) => {
  try {
    const { tran_id } = req.body;
    const order = await Order.findById(tran_id);
    if (!order) return res.status(404).send('Order not found');

    // If SSL Commerz redirected to success, assume payment is successful
    order.status = 'Paid';
    order.paymentResponse = req.body; // Save SSL Commerz response details
    await order.save();

    // Redirect to frontend success page
    res.redirect(`${req.protocol}://${req.get('host').replace('5000', '3000')}/order/${order._id}?payment=success`);
  } catch (err) {
    console.log('SSL Success error:', err);
    res.status(500).send('Server error');
  }
};

exports.sslFail = async (req, res) => {
  try {
    const { tran_id } = req.body;
    const order = await Order.findById(tran_id);
    if (order) {
      order.status = 'Payment Failed';
      order.paymentResponse = req.body; // Save SSL Commerz response details
      await order.save();
    }
    res.redirect(`${req.protocol}://${req.get('host').replace('5000', '3000')}/order/${tran_id}?payment=failed`);
  } catch (err) {
    console.log(err);
    res.status(500).send('Server error');
  }
};

exports.sslCancel = async (req, res) => {
  try {
    const { tran_id } = req.body;
    const order = await Order.findById(tran_id);
    if (order) {
      order.status = 'Payment Failed';
      order.paymentResponse = req.body; // Save SSL Commerz response details
      await order.save();
    }
    res.redirect(`${req.protocol}://${req.get('host').replace('5000', '3000')}/order/${tran_id}?payment=cancelled`);
  } catch (err) {
    console.log(err);
    res.status(500).send('Server error');
  }
};

exports.sslIpn = async (req, res) => {
  try {
    const { tran_id, val_id, status } = req.body;
    const order = await Order.findById(tran_id);
    if (!order) return res.status(200).json({ message: 'Order not found' });

    // For IPN, we can trust the status sent by SSL Commerz
    if (status === 'VALID' || status === 'VALIDATED') {
      order.status = 'Paid';
      await order.save();
    } else if (status === 'FAILED' || status === 'CANCELLED') {
      order.status = 'Payment Failed';
      await order.save();
    }
    res.status(200).json({ message: 'IPN received' });
  } catch (err) {
    console.log('SSL IPN error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
