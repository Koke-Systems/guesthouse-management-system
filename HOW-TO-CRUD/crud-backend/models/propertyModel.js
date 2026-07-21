const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  _id: String,
  name: String,
  location: String,
  rooms: Array,  // This will store the rooms array
  totalRooms: Number,
  createdAt: Date
}, { collection: 'properties' });  // <-- Add this to specify the collection name

module.exports = mongoose.model('Property', propertySchema);