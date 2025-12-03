const Shipment = require('../models/Shipment');
const Order = require('../models/Order');
const { getProvider } = require('../services/courierService');
const Settings = require('../models/Settings');

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
      if (!order.shippingInfo) return res.status(400).json({ message: 'Order does not have shipping information' });
    }

    // Get settings for courier config
    const settings = await Settings.findOne();
    const courierConfig = settings?.courierProviders?.find(cp => cp.name === provider && cp.enabled);
    if (!courierConfig) {
      return res.status(400).json({ message: 'Courier provider not configured or disabled' });
    }

    const adapter = getProvider(provider, courierConfig.config);
    const payload = shippingInfo || (order ? {
      invoice: `ORD-${order._id.toString().slice(-8)}`, // Create a shorter, unique invoice ID
      recipient_name: order.shippingInfo?.name || 'N/A',
      recipient_phone: order.shippingInfo?.phone || '',
      recipient_address: `${order.shippingInfo?.address || ''}${order.shippingInfo?.city ? ', ' + order.shippingInfo.city : ''}${order.shippingInfo?.postalCode ? ', ' + order.shippingInfo.postalCode : ''}${order.shippingInfo?.country ? ', ' + order.shippingInfo.country : ''}`,
      recipient_email: order.shippingInfo?.email || '',
      cod_amount: order.totalPrice || 0,
    } : null);

    console.log('Creating shipment with provider:', provider);
    console.log('Courier config:', courierConfig.config);
    console.log('Payload:', payload);

    // Validate required fields
    if (!payload.recipient_name || !payload.recipient_phone || !payload.recipient_address) {
      throw new Error('Missing required shipping information: recipient_name, recipient_phone, recipient_address');
    }

    // Validate phone number format (should be 11 digits for Bangladesh)
    const phoneRegex = /^\d{11}$/;
    if (!phoneRegex.test(payload.recipient_phone)) {
      throw new Error('Recipient phone number must be exactly 11 digits');
    }

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

// POST /api/couriers/bulk-create
// body: { provider, orders: [{ orderId?, shippingInfo }] }
const bulkCreate = async (req, res) => {
  try {
    const { provider, orders } = req.body;
    if (!provider || !orders || !Array.isArray(orders)) {
      return res.status(400).json({ message: 'provider and orders array required' });
    }

    // Get settings for courier config
    const settings = await Settings.findOne();
    const courierConfig = settings?.courierProviders?.find(cp => cp.name === provider && cp.enabled);
    if (!courierConfig) {
      return res.status(400).json({ message: 'Courier provider not configured or disabled' });
    }

    console.log('Retrieved courier config for', provider, ':', {
      enabled: courierConfig.enabled,
      hasApiKey: !!(courierConfig.config && courierConfig.config.apiKey),
      hasSecretKey: !!(courierConfig.config && courierConfig.config.secretKey),
      config: courierConfig.config
    });

    const adapter = getProvider(provider, courierConfig.config);

    // Prepare orders data
    const orderData = [];
    const orderMappings = [];

    for (const orderItem of orders) {
      let order = null;
      if (orderItem.orderId) {
        order = await Order.findById(orderItem.orderId);
        if (!order) continue; // Skip invalid orders
        if (!order.shippingInfo) continue; // Skip orders without shipping info
        orderMappings.push({ orderId: order._id, data: orderItem });
      }

      const payload = orderItem.shippingInfo || (order ? {
        invoice: order._id.toString(),
        recipient_name: order.shippingInfo?.name || 'N/A',
        recipient_phone: order.shippingInfo?.phone || '',
        recipient_address: `${order.shippingInfo?.address || ''}${order.shippingInfo?.city ? ', ' + order.shippingInfo.city : ''}${order.shippingInfo?.postalCode ? ', ' + order.shippingInfo.postalCode : ''}${order.shippingInfo?.country ? ', ' + order.shippingInfo.country : ''}`,
        recipient_email: order.shippingInfo?.email || '',
        cod_amount: order.totalPrice || 0,
        note: orderItem.note || '',
        item_description: orderItem.item_description || '',
      } : orderItem);

      // Validate required fields
      if (!payload.recipient_name || !payload.recipient_phone || !payload.recipient_address) {
        console.error('Skipping order due to missing shipping info:', payload);
        continue; // Skip this order
      }

      orderData.push(payload);
    }

    const results = await adapter.createBulkShipments(orderData);

    // Create shipments in database - handle different provider response formats
    const shipments = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const mapping = orderMappings[i];

      if (result.status !== 'error' && result.status !== 'processing') {
        let trackingUrl = '';
        if (provider === 'steadfast' && result.tracking_code) {
          trackingUrl = `https://portal.packzy.com/track/${result.tracking_code}`;
        }
        // Pathao doesn't provide immediate tracking URLs for bulk orders

        const ship = new Shipment({
          order: mapping?.orderId || null,
          provider: provider,
          providerShipmentId: result.consignment_id || result.merchant_order_id,
          trackingUrl: trackingUrl,
          labelUrl: '',
          rate: orderData[i].cod_amount || orderData[i].amount_to_collect || 0,
          currency: 'BDT',
          status: result.status === 'processing' ? 'processing' : 'created',
          metadata: result,
        });
        await ship.save();
        shipments.push(ship);

        // Update order status if applicable
        if (mapping?.orderId) {
          await Order.findByIdAndUpdate(mapping.orderId, { status: 'Shipped' });
        }
      } else if (result.status === 'processing') {
        // For async processing (like Pathao bulk), create shipment with processing status
        const ship = new Shipment({
          order: mapping?.orderId || null,
          provider: provider,
          providerShipmentId: result.merchant_order_id,
          trackingUrl: '',
          labelUrl: '',
          rate: orderData[i].cod_amount || orderData[i].amount_to_collect || 0,
          currency: 'BDT',
          status: 'processing',
          metadata: result,
        });
        await ship.save();
        shipments.push(ship);

        // Update order status if applicable
        if (mapping?.orderId) {
          await Order.findByIdAndUpdate(mapping.orderId, { status: 'Processing' });
        }
      }
    }

    res.json({ success: true, shipments, results });
  } catch (err) {
    console.error('Bulk create shipment error', err);
    res.status(500).json({ message: 'Failed to create bulk shipments', error: err.message });
  }
};

// POST /api/couriers/status
// body: { provider, identifier, type: 'consignment'|'invoice'|'tracking' }
const getStatus = async (req, res) => {
  try {
    const { provider, identifier, type = 'consignment' } = req.body;
    if (!provider || !identifier) {
      return res.status(400).json({ message: 'provider and identifier required' });
    }

    // Get settings for courier config
    const settings = await Settings.findOne();
    const courierConfig = settings?.courierProviders?.find(cp => cp.name === provider && cp.enabled);
    if (!courierConfig) {
      return res.status(400).json({ message: 'Courier provider not configured or disabled' });
    }

    const adapter = getProvider(provider, courierConfig.config);
    const status = await adapter.getStatus(identifier, type);

    res.json({ success: true, status });
  } catch (err) {
    console.error('Get status error', err);
    res.status(500).json({ message: 'Failed to get status', error: err.message });
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

module.exports = { quote, create, bulkCreate, getStatus, getShipment, webhook };
