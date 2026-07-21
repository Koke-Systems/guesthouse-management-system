var express = require('express');
var Client = require('../models/clientModel');
var Property = require('../models/propertyModel');

var router = express.Router();

// Get all clients
router.get('/', async function(req, res) {
  try {
    var clients = await Client.find();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single client
router.get('/:id', async function(req, res) {
  try {
    var client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new client
router.post('/', async function(req, res) {
  try {
    // Calculate due amount
    const paidAmount = req.body.paidAmount || 0;
    const rate = req.body.rate || 0;
    const dueAmount = rate - paidAmount;
    
    const clientData = {
      ...req.body,
      dueAmount: dueAmount > 0 ? dueAmount : 0,
      status: dueAmount <= 0 ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Pending')
    };
    
    var newClient = new Client(clientData);
    var saved = await newClient.save();
    
    // Update room availability if needed
    if (saved.roomNumber && saved.propertyId) {
      const property = await Property.findById(saved.propertyId);
      if (property) {
        const roomIndex = property.rooms.findIndex(r => r.roomNumber == saved.roomNumber);
        if (roomIndex !== -1) {
          property.rooms[roomIndex].isAvailable = false;
          await property.save();
        }
      }
    }
    
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update client
router.put('/:id', async function(req, res) {
  try {
    const existingClient = await Client.findById(req.params.id);
    if (!existingClient) return res.status(404).json({ message: 'Client not found' });
    
    // Calculate due amount
    const paidAmount = req.body.paidAmount !== undefined ? req.body.paidAmount : existingClient.paidAmount;
    const rate = req.body.rate !== undefined ? req.body.rate : existingClient.rate;
    const dueAmount = rate - paidAmount;
    
    const updateData = {
      ...req.body,
      dueAmount: dueAmount > 0 ? dueAmount : 0,
      status: dueAmount <= 0 ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Pending')
    };
    
    var updated = await Client.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    // Update room availability if room changed and new room is different
    if (req.body.roomNumber && req.body.propertyId) {
      const property = await Property.findById(req.body.propertyId);
      if (property) {
        // Mark new room as occupied
        const newRoomIndex = property.rooms.findIndex(r => r.roomNumber == req.body.roomNumber);
        if (newRoomIndex !== -1 && property.rooms[newRoomIndex].isAvailable !== false) {
          property.rooms[newRoomIndex].isAvailable = false;
          await property.save();
        }
      }
    }
    
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete client
router.delete('/:id', async function(req, res) {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    
    // Make room available again
    if (client.roomNumber && client.propertyId) {
      const property = await Property.findById(client.propertyId);
      if (property) {
        const roomIndex = property.rooms.findIndex(r => r.roomNumber == client.roomNumber);
        if (roomIndex !== -1) {
          property.rooms[roomIndex].isAvailable = true;
          await property.save();
        }
      }
    }
    
    await Client.findByIdAndDelete(req.params.id);
    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;