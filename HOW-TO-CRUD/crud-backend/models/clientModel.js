var mongoose = require('mongoose');

var clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  propertyId: { type: String, ref: 'Property' },
  propertyName: String,
  propertyLocation: String,
  roomNumber: Number,
  roomName: String,
  rate: Number,
  job: String,
  status: { type: String, default: 'Pending' }, // Paid, Pending, Partial
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  checkInDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  checkOutDate: String,
  notes: String
}, { collection: 'clients' });

module.exports = mongoose.model('Client', clientSchema);