const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: function () { return !this.isGuest; }, unique: false },
  password: { type: String },
  phone: { type: String },
  isAdmin: { type: Boolean, default: false },
  isGuest: { type: Boolean, default: false },
  blocked: { type: Boolean, default: false },
  shippingAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    postalCode: String,
    country: String,
  },
  billingAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    postalCode: String,
    country: String,
  },
  savedAddresses: [
    {
      type: String,
      label: String,
      name: String,
      phone: String,
      address: String,
      city: String,
      postalCode: String,
      country: String,
    }
  ],
}, { timestamps: true });
module.exports = mongoose.model('User', userSchema);
