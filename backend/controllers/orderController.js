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
    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    // Filtering
    const search = req.query.search || '';
    const status = req.query.status || '';

    let query = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { _id: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } },
        { totalPrice: isNaN(search) ? undefined : Number(search) },
        { paymentMethod: { $regex: search, $options: 'i' } },
        { shipmentName: { $regex: search, $options: 'i' } }
      ].filter(Boolean);
    }

    const total = await Order.countDocuments(query);
    const pages = Math.ceil(total / limit);

    const orders = await Order.find(query)
      .populate('user')
      .populate('items.variationId')
      .sort({ createdAt: -1 }) // newest first
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    // Add shipments array based on order shipment fields
    const ordersWithShipments = orders.map(order => {
      const orderObj = order.toObject();
      if (order.shipmentId && order.shipmentName) {
        orderObj.shipments = [{
          provider: order.shipmentName,
          status: order.shipmentStatus || 'created',
          providerShipmentId: order.shipmentId
        }];
      } else {
        orderObj.shipments = [];
      }
      return orderObj;
    });

    res.json({ orders: ordersWithShipments, page, pages, total });
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

// Add item to order
exports.addItemToOrder = async (req, res) => {
  try {
    const { productId, variationId, qty, price } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Check stock availability
    if (variationId) {
      const variation = await ProductVariation.findById(variationId);
      if (!variation) return res.status(400).json({ message: 'Variation not found' });
      if (variation.stock < qty) return res.status(400).json({ message: 'Not enough stock for variation' });
      variation.stock -= qty;
      await variation.save();
    } else {
      const product = await Product.findById(productId);
      if (!product) return res.status(400).json({ message: 'Product not found' });
      if (product.stock < qty) return res.status(400).json({ message: 'Not enough stock for product' });
      product.stock -= qty;
      await product.save();
    }

    // Get product details
    let name, productData;
    if (variationId) {
      const variation = await ProductVariation.findById(variationId).populate('product');
      name = `${variation.product.name} (${variation.size})`;
      productData = {
        _id: variation.product._id,
        name: variation.product.name,
        price: variation.product.price,
        discountedPrice: variation.product.discountedPrice
      };
    } else {
      const product = await Product.findById(productId);
      name = product.name;
      productData = {
        _id: product._id,
        name: product.name,
        price: product.price,
        discountedPrice: product.discountedPrice
      };
    }

    // Add item to order
    order.items.push({
      product: productData,
      variationId,
      name,
      qty,
      price
    });

    // Recalculate total price
    order.totalPrice = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);

    await order.save();
    res.json(order);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Remove item from order
exports.removeItemFromOrder = async (req, res) => {
  try {
    const { itemIndex } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (itemIndex < 0 || itemIndex >= order.items.length) return res.status(400).json({ message: 'Invalid item index' });

    const item = order.items[itemIndex];

    // Return stock
    if (item.variationId) {
      const variation = await ProductVariation.findById(item.variationId);
      if (variation) {
        variation.stock += item.qty;
        await variation.save();
      }
    } else {
      const product = await Product.findById(item.product._id || item.product);
      if (product) {
        product.stock += item.qty;
        await product.save();
      }
    }

    // Remove item
    order.items.splice(itemIndex, 1);

    // Recalculate total price
    order.totalPrice = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);

    await order.save();
    res.json(order);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Update item quantity in order
exports.updateItemQuantity = async (req, res) => {
  try {
    const { itemIndex, newQty } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (itemIndex < 0 || itemIndex >= order.items.length) return res.status(400).json({ message: 'Invalid item index' });
    if (newQty <= 0) return res.status(400).json({ message: 'Quantity must be positive' });

    const item = order.items[itemIndex];
    const qtyDiff = newQty - item.qty;

    // Adjust stock
    if (qtyDiff > 0) {
      // Increasing quantity - check and reduce stock
      if (item.variationId) {
        const variation = await ProductVariation.findById(item.variationId);
        if (!variation) return res.status(400).json({ message: 'Variation not found' });
        if (variation.stock < qtyDiff) return res.status(400).json({ message: 'Not enough stock for variation' });
        variation.stock -= qtyDiff;
        await variation.save();
      } else {
        const product = await Product.findById(item.product._id || item.product);
        if (!product) return res.status(400).json({ message: 'Product not found' });
        if (product.stock < qtyDiff) return res.status(400).json({ message: 'Not enough stock for product' });
        product.stock -= qtyDiff;
        await product.save();
      }
    } else if (qtyDiff < 0) {
      // Decreasing quantity - return stock
      if (item.variationId) {
        const variation = await ProductVariation.findById(item.variationId);
        if (variation) {
          variation.stock += Math.abs(qtyDiff);
          await variation.save();
        }
      } else {
        const product = await Product.findById(item.product._id || item.product);
        if (product) {
          product.stock += Math.abs(qtyDiff);
          await product.save();
        }
      }
    }

    // Update quantity
    item.qty = newQty;

    // Recalculate total price
    order.totalPrice = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);

    await order.save();
    res.json(order);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Update order shipping address
exports.updateOrderAddress = async (req, res) => {
  try {
    const { shippingInfo } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Validate required fields
    if (!shippingInfo || !shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
      return res.status(400).json({ message: 'Missing required shipping information' });
    }

    order.shippingInfo = shippingInfo;
    await order.save();
    res.json(order);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
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
