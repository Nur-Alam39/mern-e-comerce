const mongoose = require('mongoose');
const variationSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    size: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('ProductVariation', variationSchema);
