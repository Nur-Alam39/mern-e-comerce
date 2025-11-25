const mongoose = require('mongoose');
const settingsSchema = new mongoose.Schema({
    brandName: { type: String, default: 'MERN Shop' },
    primaryColor: { type: String, default: '#007bff' },
    secondaryColor: { type: String, default: '#6c757d' },
    currency: { type: String, default: 'USD', enum: ['USD', 'EUR', 'GBP', 'BDT', 'INR'] },
    paymentMethods: [
        {
            name: { type: String, enum: ['bkash', 'nagad', 'ssl_commerce', 'stripe', 'paypal'] },
            enabled: { type: Boolean, default: false },
            logo: { type: String, default: '' },
            config: mongoose.Schema.Types.Mixed
        }
    ],
    courierProviders: [
        {
            name: { type: String },
            enabled: { type: Boolean, default: false },
            config: mongoose.Schema.Types.Mixed
        }
    ],
    socialLinks: [
        {
            name: { type: String },
            url: { type: String },
            icon: { type: String }
        }
    ],
    facebookPixelId: { type: String, default: '' },
    productListPagination: { type: String, enum: ['numbered', 'infinite'], default: 'numbered' },
    address: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    brandLogo: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
