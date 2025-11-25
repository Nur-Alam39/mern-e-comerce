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
    this.apiKey = opts.apiKey || process.env.PATHAO_API_KEY;
    this.baseUrl = opts.baseUrl || process.env.PATHAO_API_URL || 'https://api.pathao.com';
  }

  // Minimal quote implementation — replace with real API calls from the pathao-courier library
  async quote(shippingInfo) {
    if (!this.apiKey) {
      // simulate a quote when no credentials are present
      return { provider: 'pathao', service: 'standard', currency: 'BDT', amount: 120 };
    }
    // TODO: call Pathao API to get real quote
    // Example using axios (actual endpoints/params depend on the provider lib):
    // const res = await axios.post(`${this.baseUrl}/quote`, { shippingInfo }, { headers: { 'Authorization': `Bearer ${this.apiKey}` } });
    // return res.data;
    return { provider: 'pathao', service: 'standard', currency: 'BDT', amount: 120 };
  }

  async createShipment(shippingInfo) {
    if (!this.apiKey) {
      // simulate created shipment
      return {
        provider: 'pathao',
        providerShipmentId: `sim-${Date.now()}`,
        trackingUrl: '',
        labelUrl: '',
        rate: 120,
        currency: 'BDT',
        status: 'created',
      };
    }
    // TODO: implement real create shipment call using provider SDK or HTTP API
    return {
      provider: 'pathao',
      providerShipmentId: `real-${Date.now()}`,
      trackingUrl: '',
      labelUrl: '',
      rate: 120,
      currency: 'BDT',
      status: 'created',
    };
  }
}

// Simple registry
const providers = {
  pathao: (opts = {}) => new PathaoAdapter(opts),
};

function getProvider(name, opts = {}) {
  const key = (name || '').toLowerCase();
  if (!providers[key]) throw new Error(`Courier provider not found: ${name}`);
  return providers[key](opts);
}

module.exports = { getProvider, PathaoAdapter };
