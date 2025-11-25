const mongoose = require('mongoose');

const sliderSchema = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  image: { type: String },
  ctaText: { type: String },
  ctaLink: { type: String },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Slider', sliderSchema);
