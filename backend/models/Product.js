const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true, default: 0 },
  images: [String],
  stock: { type: Number, default: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  featured: { type: Boolean, default: false },
  newArrival: { type: Boolean, default: false },
  bestSelling: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  discountedPrice: { type: Number, default: 0 },
}, { timestamps: true });

productSchema.virtual('isOutOfStock').get(function () {
  return this.stock <= 0;
});

module.exports = mongoose.model('Product', productSchema);
