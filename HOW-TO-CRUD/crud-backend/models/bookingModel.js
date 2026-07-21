// models/bookingModel.js
var mongoose = require('mongoose');

var bookingSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  clientName: { type: String, required: true },
  propertyId: { type: String, ref: 'Property', required: true },
  propertyName: String,
  roomNumber: { type: Number, required: true },
  roomName: String,
  rate: Number,  // Add this field
  checkInDate: { type: String, required: true },
  checkOutDate: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Confirmed', 'Checked-in', 'Checked-out', 'Cancelled'],
    default: 'Confirmed'
  },
  totalAmount: Number,
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  createdAt: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, { collection: 'bookings' });

module.exports = mongoose.model('Booking', bookingSchema);