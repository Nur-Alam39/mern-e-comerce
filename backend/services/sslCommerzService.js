const SSLCommerzPayment = require('sslcommerz-lts');
const axios = require('axios');
const Settings = require('../models/Settings');

class SSLCommerzService {
  constructor() {
    this.sslcz = null;
  }

  async getSSLConfig() {
    const settings = await Settings.findOne();
    const sslMethod = settings && settings.paymentMethods && settings.paymentMethods.find(m => m.name === 'ssl_commerce');
    if (!sslMethod || !sslMethod.config || !sslMethod.config.storeId || !sslMethod.config.storePassword) {
      throw new Error('SSL Commerz not properly configured');
    }
    return {
      storeId: sslMethod.config.storeId,
      storePassword: sslMethod.config.storePassword,
      isLive: sslMethod.config.isLive === true
    };
  }

  async initiatePayment(orderData) {
    const config = await this.getSSLConfig();

    const data = {
      total_amount: orderData.totalPrice,
      currency: 'BDT',
      tran_id: orderData.orderId,
      success_url: `${orderData.protocol}://${orderData.host}/api/orders/ssl-success`,
      fail_url: `${orderData.protocol}://${orderData.host}/api/orders/ssl-fail`,
      cancel_url: `${orderData.protocol}://${orderData.host}/api/orders/ssl-cancel`,
      ipn_url: `${orderData.protocol}://${orderData.host}/api/orders/ssl-ipn`,
      shipping_method: 'Courier',
      product_name: orderData.productNames,
      product_category: 'General',
      product_profile: 'general',
      cus_name: orderData.customerName,
      cus_email: orderData.customerEmail || 'customer@example.com',
      cus_add1: orderData.customerAddress,
      cus_add2: orderData.customerCity,
      cus_city: orderData.customerCity,
      cus_state: orderData.customerCity,
      cus_postcode: orderData.customerPostcode || '1000',
      cus_country: orderData.customerCountry,
      cus_phone: orderData.customerPhone,
      cus_fax: orderData.customerPhone,
      ship_name: orderData.customerName,
      ship_add1: orderData.customerAddress,
      ship_add2: orderData.customerCity,
      ship_city: orderData.customerCity,
      ship_state: orderData.customerCity,
      ship_postcode: orderData.customerPostcode || '1000',
      ship_country: orderData.customerCountry,
    };

    const sslcz = new SSLCommerzPayment(config.storeId, config.storePassword, config.isLive);
    const apiResponse = await sslcz.init(data);

    if (apiResponse.GatewayPageURL) {
      return { success: true, gatewayUrl: apiResponse.GatewayPageURL };
    } else {
      return { success: false, error: 'Failed to initiate SSL Commerz payment' };
    }
  }

  async validatePayment(valId) {
    const config = await this.getSSLConfig();

    const validationUrl = config.isLive
      ? 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php'
      : 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php';

    const validationData = new URLSearchParams();
    validationData.append('val_id', valId);
    validationData.append('store_id', config.storeId);
    validationData.append('store_passwd', config.storePassword);

    const validationResponse = await axios.post(validationUrl, validationData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return validationResponse.data;
  }
}

module.exports = new SSLCommerzService();