const Shipment = require('../models/Shipment');
const Order = require('../models/Order');
const { getProvider } = require('../services/courierService');

// POST /api/couriers/quote
// body: { provider: 'pathao', shippingInfo: { name, phone, address, city, postalCode, country, items, weight } }
const quote = async (req, res) => {
  try {
    const { provider, shippingInfo } = req.body;
    if (!provider || !shippingInfo) return res.status(400).json({ message: 'provider and shippingInfo required' });
    const adapter = getProvider(provider);
    const q = await adapter.quote(shippingInfo);
    res.json({ success: true, quote: q });
  } catch (err) {
    console.error('Quote error', err);
    res.status(500).json({ message: 'Failed to get quote', error: err.message });
  }
};

// POST /api/couriers/create
// body: { provider, orderId?, shippingInfo }
const create = async (req, res) => {
  try {
    const { provider, orderId, shippingInfo } = req.body;
    if (!provider || (!orderId && !shippingInfo)) return res.status(400).json({ message: 'provider and (orderId or shippingInfo) required' });

    let order = null;
    if (orderId) {
      order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ message: 'Order not found' });
    }

    const adapter = getProvider(provider);
    const payload = shippingInfo || (order ? order.shippingInfo : null);
    const result = await adapter.createShipment(payload || {});

    const ship = new Shipment({
      order: order ? order._id : null,
      provider: provider,
      providerShipmentId: result.providerShipmentId || result.id || null,
      trackingUrl: result.trackingUrl || null,
      labelUrl: result.labelUrl || null,
      rate: result.rate || null,
      currency: result.currency || 'BDT',
      status: result.status || 'created',
      metadata: result,
    });
    await ship.save();

    // Optionally update order status
    if (order) {
      order.status = 'Shipped';
      await order.save();
    }

    res.json({ success: true, shipment: ship });
  } catch (err) {
    console.error('Create shipment error', err);
    res.status(500).json({ message: 'Failed to create shipment', error: err.message });
  }
};

const getShipment = async (req, res) => {
  try {
    const id = req.params.id;
    if (id) {
      const ship = await Shipment.findById(id).populate('order');
      if (!ship) return res.status(404).json({ message: 'Shipment not found' });
      return res.json({ success: true, shipment: ship });
    }
    // if no id, support listing by orderId via query param
    const { orderId } = req.query;
    if (orderId) {
      const list = await Shipment.find({ order: orderId }).sort({ createdAt: -1 });
      return res.json({ success: true, shipments: list });
    }
    // otherwise return all (admin)
    const all = await Shipment.find().sort({ createdAt: -1 });
    res.json({ success: true, shipments: all });
  } catch (err) {
    console.error('Get shipment error', err);
    res.status(500).json({ message: 'Failed to get shipment', error: err.message });
  }
};

// Simple webhook receiver for courier callbacks
const webhook = async (req, res) => {
  try {
    const { provider, providerShipmentId, status, data } = req.body;
    if (!provider || !providerShipmentId) return res.status(400).json({ message: 'provider and providerShipmentId required' });
    const ship = await Shipment.findOne({ provider, providerShipmentId });
    if (!ship) return res.status(404).json({ message: 'Shipment not found' });
    ship.status = status || ship.status;
    ship.metadata = Object.assign({}, ship.metadata || {}, { webhook: data || req.body });
    await ship.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook error', err);
    res.status(500).json({ message: 'Webhook handling failed', error: err.message });
  }
};

module.exports = { quote, create, getShipment, webhook };
