/*
  Courier service abstraction.
  - Provides a register/get mechanism for courier providers.
  - Includes a small Pathao adapter stub (implement real HTTP calls using credentials).
  - This file is intentionally minimal and safe; it returns simulated responses when no
    real credentials are provided so the API is still testable.
*/
const axios = require('axios');

class BaseAdapter {
  constructor(opts = {}) { this.opts = opts; }
  async quote(shippingInfo, opts = {}) { throw new Error('Not implemented'); }
  async createShipment(shippingInfo, opts = {}) { throw new Error('Not implemented'); }
}

class PathaoAdapter extends BaseAdapter {
  constructor(opts = {}) {
    super(opts);
    this.clientId = opts.clientId;
    this.clientSecret = opts.clientSecret;
    this.username = opts.username;
    this.password = opts.password;
    this.storeId = opts.storeId;
    this.baseUrl = opts.baseUrl || 'https://api-hermes.pathao.com';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret || !this.username || !this.password) {
      throw new Error('Pathao API credentials not configured');
    }

    try {
      const response = await axios.post(`${this.baseUrl}/aladdin/api/v1/issue-token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'password',
        username: this.username,
        password: this.password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = response.data;
      if (data.access_token) {
        this.accessToken = data.access_token;
        // Token expires in seconds, convert to milliseconds and subtract 5 minutes for safety
        this.tokenExpiry = Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000);
        return this.accessToken;
      } else {
        throw new Error('Failed to obtain access token');
      }
    } catch (error) {
      console.error('Pathao token error:', (error.response && error.response.data) || error.message);
      throw new Error(`Pathao token error: ${(error.response && error.response.data && error.response.data.message) || error.message}`);
    }
  }

  async quote(shippingInfo) {
    // Pathao doesn't have a direct quote API, simulate based on weight/distance
    return { provider: 'pathao', service: 'standard', currency: 'BDT', amount: 120 };
  }

  async createShipment(shippingInfo) {
    if (!this.storeId) {
      throw new Error('Pathao store ID not configured');
    }

    const token = await this.getAccessToken();

    const payload = {
      store_id: this.storeId,
      merchant_order_id: shippingInfo.invoice || shippingInfo.merchant_order_id || `ORD-${Date.now()}`,
      recipient_name: shippingInfo.recipient_name || shippingInfo.name,
      recipient_phone: shippingInfo.recipient_phone || shippingInfo.phone,
      recipient_address: shippingInfo.recipient_address || shippingInfo.address,
      delivery_type: shippingInfo.delivery_type || 48, // 48 for Normal Delivery
      item_type: shippingInfo.item_type || 2, // 2 for Parcel
      special_instruction: shippingInfo.special_instruction || shippingInfo.note || '',
      item_quantity: shippingInfo.item_quantity || shippingInfo.total_lot || 1,
      item_weight: shippingInfo.item_weight || 0.5,
      item_description: shippingInfo.item_description || '',
      amount_to_collect: Math.round(shippingInfo.amount_to_collect || shippingInfo.cod_amount || shippingInfo.amount || 0),
    };

    // Add optional fields if provided
    if (shippingInfo.recipient_secondary_phone) {
      payload.recipient_secondary_phone = shippingInfo.recipient_secondary_phone;
    }
    if (shippingInfo.recipient_city) {
      payload.recipient_city = shippingInfo.recipient_city;
    }
    if (shippingInfo.recipient_zone) {
      payload.recipient_zone = shippingInfo.recipient_zone;
    }
    if (shippingInfo.recipient_area) {
      payload.recipient_area = shippingInfo.recipient_area;
    }

    try {
      console.log('Pathao API call:', {
        url: `${this.baseUrl}/aladdin/api/v1/orders`,
        payload: payload
      });

      const response = await axios.post(`${this.baseUrl}/aladdin/api/v1/orders`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Pathao API response:', response.data);

      const data = response.data;
      if (data.code !== 200) {
        throw new Error(data.message || 'Failed to create order');
      }

      return {
        provider: 'pathao',
        providerShipmentId: data.data.consignment_id,
        merchantOrderId: data.data.merchant_order_id,
        status: data.data.order_status || 'Pending',
        rate: data.data.delivery_fee || 0,
        currency: 'BDT',
        metadata: data.data,
      };
    } catch (error) {
      console.error('Pathao create order error:', (error.response && error.response.data) || error.message);

      // Handle Pathao API validation errors
      if (error.response && error.response.data && error.response.data.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        throw new Error(`Pathao validation error: ${errorMessages.join(', ')}`);
      }

      throw new Error(`Pathao API error: ${(error.response && error.response.data && error.response.data.message) || error.message}`);
    }
  }

  async createBulkShipments(orders) {
    if (!this.storeId) {
      throw new Error('Pathao store ID not configured');
    }

    const token = await this.getAccessToken();

    const ordersPayload = orders.map(order => ({
      store_id: this.storeId,
      merchant_order_id: order.invoice || order.merchant_order_id || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      recipient_name: order.recipient_name || order.name,
      recipient_phone: order.recipient_phone || order.phone,
      recipient_address: order.recipient_address || order.address,
      delivery_type: order.delivery_type || 48,
      item_type: order.item_type || 2,
      special_instruction: order.special_instruction || order.note || '',
      item_quantity: order.item_quantity || order.total_lot || 1,
      item_weight: order.item_weight || 0.5,
      item_description: order.item_description || '',
      amount_to_collect: Math.round(order.amount_to_collect || order.cod_amount || order.amount || 0),
      ...(order.recipient_secondary_phone && { recipient_secondary_phone: order.recipient_secondary_phone }),
      ...(order.recipient_city && { recipient_city: order.recipient_city }),
      ...(order.recipient_zone && { recipient_zone: order.recipient_zone }),
      ...(order.recipient_area && { recipient_area: order.recipient_area }),
    }));

    try {
      const response = await axios.post(`${this.baseUrl}/aladdin/api/v1/orders/bulk`, {
        orders: ordersPayload
      }, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = response.data;
      if (data.code !== 202) {
        throw new Error(data.message || 'Failed to create bulk orders');
      }

      // For bulk orders, Pathao returns status 202 and processes asynchronously
      // We need to return a structure that indicates processing
      return orders.map(order => ({
        merchant_order_id: order.merchant_order_id || order.invoice,
        status: 'processing', // Bulk orders are processed asynchronously
        consignment_id: null, // Will be available later
        error: null,
      }));
    } catch (error) {
      console.error('Pathao bulk order error:', (error.response && error.response.data) || error.message);

      // Handle Pathao API validation errors
      if (error.response && error.response.data && error.response.data.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        throw new Error(`Pathao validation error: ${errorMessages.join(', ')}`);
      }

      throw new Error(`Pathao bulk API error: ${(error.response && error.response.data && error.response.data.message) || error.message}`);
    }
  }
}

class SteadfastAdapter extends BaseAdapter {
  constructor(opts = {}) {
    super(opts);
    this.apiKey = opts.apiKey;
    this.secretKey = opts.secretKey;
    this.baseUrl = opts.baseUrl || 'https://portal.packzy.com/api/v1';

    // Try alternative URLs if the primary one fails
    this.alternativeUrls = [
      'https://portal.packzy.com/api/v1',
      'https://portal.steadfast.com.bd/api/v1',
      'https://api.steadfast.com.bd/v1'
    ];
    console.log('SteadfastAdapter initialized with baseUrl:', this.baseUrl);
  }

  async quote(shippingInfo) {
    // Steadfast doesn't have a direct quote API, simulate based on weight/distance
    return { provider: 'steadfast', service: 'standard', currency: 'BDT', amount: 100 };
  }

  async createShipment(shippingInfo) {
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Steadfast API credentials not configured');
    }

    const payload = {
      invoice: shippingInfo.invoice || `INV-${Date.now()}`,
      recipient_name: shippingInfo.recipient_name || shippingInfo.name,
      recipient_phone: shippingInfo.recipient_phone || shippingInfo.phone,
      recipient_address: shippingInfo.recipient_address || shippingInfo.address,
      cod_amount: shippingInfo.cod_amount || shippingInfo.amount || 0,
      note: shippingInfo.note || '',
      item_description: shippingInfo.item_description || '',
      total_lot: shippingInfo.total_lot || 1,
      delivery_type: shippingInfo.delivery_type || 0,
      recipient_email: shippingInfo.recipient_email || '',
      alternative_phone: shippingInfo.alternative_phone || '',
    };

    try {
      console.log('Steadfast API call:', {
        url: `${this.baseUrl}/create_order`,
        headers: {
          'Api-Key': this.apiKey ? '***' + this.apiKey.slice(-4) : 'MISSING',
          'Secret-Key': this.secretKey ? '***' + this.secretKey.slice(-4) : 'MISSING',
          'Content-Type': 'application/json',
        },
        payload: payload
      });

      const response = await axios.post(`${this.baseUrl}/create_order`, payload, {
        headers: {
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
          'Content-Type': 'application/json',
        },
      });

      console.log('Steadfast API response:', response.data);

      const data = response.data;
      console.log('Steadfast API response data:', data);

      if (data.status !== 200) {
        throw new Error(data.message || 'Failed to create order');
      }

      // Handle different response structures
      const consignment = data.consignment || data;
      if (!consignment) {
        throw new Error('Invalid response format from Steadfast API');
      }

      return {
        provider: 'steadfast',
        providerShipmentId: consignment.consignment_id || consignment.id,
        trackingCode: consignment.tracking_code,
        invoice: consignment.invoice,
        status: consignment.status || 'created',
        rate: shippingInfo.cod_amount || 0,
        currency: 'BDT',
        metadata: consignment,
      };
    } catch (error) {
      console.error('Steadfast create order error:', (error.response && error.response.data) || error.message);
      throw new Error(`Steadfast API error: ${(error.response && error.response.data && error.response.data.message) || error.message}`);
    }
  }

  async createBulkShipments(orders) {
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Steadfast API credentials not configured');
    }

    const data = orders.map(order => ({
      invoice: order.invoice || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      recipient_name: order.recipient_name || order.name,
      recipient_phone: order.recipient_phone || order.phone,
      recipient_address: order.recipient_address || order.address,
      cod_amount: order.cod_amount || order.amount || 0,
      note: order.note || '',
      item_description: order.item_description || '',
      total_lot: order.total_lot || 1,
      delivery_type: order.delivery_type || 0,
      recipient_email: order.recipient_email || '',
      alternative_phone: order.alternative_phone || '',
    }));

    try {
      const response = await axios.post(`${this.baseUrl}/create_order/bulk-order`, { data }, {
        headers: {
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
          'Content-Type': 'application/json',
        },
      });

      const result = response.data;
      return result.map(item => ({
        invoice: item.invoice,
        consignment_id: item.consignment_id,
        tracking_code: item.tracking_code,
        status: item.status,
        error: item.status === 'error' ? 'Failed to create' : null,
      }));
    } catch (error) {
      console.error('Steadfast bulk order error:', (error.response && error.response.data) || error.message);
      throw new Error(`Steadfast bulk API error: ${(error.response && error.response.data && error.response.data.message) || error.message}`);
    }
  }

  async getStatus(identifier, type = 'consignment') {
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Steadfast API credentials not configured');
    }

    let endpoint;
    if (type === 'consignment') {
      endpoint = `/status_by_cid/${identifier}`;
    } else if (type === 'invoice') {
      endpoint = `/status_by_invoice/${identifier}`;
    } else if (type === 'tracking') {
      endpoint = `/status_by_trackingcode/${identifier}`;
    } else {
      throw new Error('Invalid status check type');
    }

    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Steadfast status check error:', (error.response && error.response.data) || error.message);
      throw new Error(`Steadfast status API error: ${(error.response && error.response.data && error.response.data.message) || error.message}`);
    }
  }
}

// Simple registry
const providers = {
  pathao: (opts = {}) => new PathaoAdapter(opts),
  steadfast: (opts = {}) => new SteadfastAdapter(opts),
};

function getProvider(name, opts = {}) {
  const key = (name || '').toLowerCase();
  if (!providers[key]) throw new Error(`Courier provider not found: ${name}`);
  return providers[key](opts);
}

module.exports = { getProvider, PathaoAdapter, SteadfastAdapter };
