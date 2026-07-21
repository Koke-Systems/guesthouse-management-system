const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  propertyId: { type: String, required: true },
  number: String,
  type: String,
  rent: Number,
  occupied: Boolean,
  clientId: String,
  features: [String],
});

module.exports = mongoose.model('Room', roomSchema);
