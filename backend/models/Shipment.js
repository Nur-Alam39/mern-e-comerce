const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  provider: { type: String, required: true },
  providerShipmentId: { type: String },
  trackingUrl: { type: String },
  labelUrl: { type: String },
  rate: { type: Number },
  currency: { type: String, default: 'BDT' },
  status: { type: String, default: 'created' },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('Shipment', shipmentSchema);
