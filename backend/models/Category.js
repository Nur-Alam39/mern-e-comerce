const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  image: { type: String },
  main: { type: Boolean, default: false },
  showInNavbar: { type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.model('Category', categorySchema);
