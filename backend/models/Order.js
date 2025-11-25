const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  items: [
    {
      product: {
        _id: mongoose.Schema.Types.ObjectId,
        name: String,
        price: Number,
        discountedPrice: Number,
        // add other fields as needed
      },
      variationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariation' },
      name: String,
      qty: Number,
      price: Number,
    }
  ],
  shippingInfo: {
    name: String,
    phone: String,
    address: String,
    city: String,
    postalCode: String,
    country: String,
    email: String,
  },
  paymentMethod: { type: String, default: 'Cash on Delivery' },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
}, { timestamps: true });
module.exports = mongoose.model('Order', orderSchema);
