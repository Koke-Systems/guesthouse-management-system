var express = require('express');
var Booking = require('../models/bookingModel');
var Property = require('../models/propertyModel');
var Client = require('../models/clientModel');

var router = express.Router();

// Get all bookings
router.get('/', async function(req, res) {
  try {
    var bookings = await Booking.find();
    console.log('Found bookings:', bookings.length);
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get bookings by date range
router.get('/date-range', async function(req, res) {
  try {
    const { startDate, endDate } = req.query;
    console.log('Fetching bookings from', startDate, 'to', endDate);
    
    var bookings = await Booking.find({
      $or: [
        { checkInDate: { $gte: startDate, $lte: endDate } },
        { checkOutDate: { $gte: startDate, $lte: endDate } },
        {
          $and: [
            { checkInDate: { $lte: startDate } },
            { checkOutDate: { $gte: endDate } }
          ]
        }
      ]
    });
    
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching date range bookings:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get availability for a specific date
router.get('/availability/:date', async function(req, res) {
  try {
    const targetDate = req.params.date;
    console.log('========================================');
    console.log('Checking availability for date:', targetDate);
    
    // Get all properties
    const properties = await Property.find();
    console.log('Found properties:', properties.length);
    
    if (properties.length === 0) {
      console.log('No properties found in database!');
      return res.json([]);
    }
    
    // Log property details
    properties.forEach(prop => {
      console.log(`Property: ${prop.name}, Rooms: ${prop.rooms?.length || 0}`);
    });
    
    // Get bookings that cover this date
    const bookings = await Booking.find({
      checkInDate: { $lte: targetDate },
      checkOutDate: { $gte: targetDate },
      status: { $in: ['Confirmed', 'Checked-in'] }
    });
    console.log('Found bookings for this date:', bookings.length);
    
    if (bookings.length > 0) {
      bookings.forEach(booking => {
        console.log(`Booked: ${booking.roomName} (#${booking.roomNumber}) - ${booking.clientName}`);
      });
    }
    
    // Create a map of booked rooms
    const bookedRooms = new Map();
    bookings.forEach(booking => {
      const key = `${booking.propertyId}_${booking.roomNumber}`;
      bookedRooms.set(key, booking);
      console.log(`Marked as booked: Property ${booking.propertyId}, Room ${booking.roomNumber}`);
    });
    
    // Build availability response
    const availability = properties.map(property => {
      const propertyRooms = property.rooms || [];
      console.log(`Processing property ${property.name} with ${propertyRooms.length} rooms`);
      
      const rooms = propertyRooms.map(room => {
        const key = `${property._id}_${room.roomNumber}`;
        const booking = bookedRooms.get(key);
        
        return {
          roomNumber: room.roomNumber,
          roomName: room.roomName,
          isAvailable: !booking,
          isBooked: !!booking,
          bookingId: booking?._id || null,
          clientName: booking?.clientName || null,
          pricePerNight: room.pricePerNight,
          capacity: room.capacity,
          amenities: room.amenities || []
        };
      });
      
      const availableCount = rooms.filter(r => r.isAvailable).length;
      const bookedCount = rooms.filter(r => r.isBooked).length;
      console.log(`Property ${property.name}: ${availableCount} available, ${bookedCount} booked`);
      
      return {
        propertyId: property._id,
        propertyName: property.name,
        location: property.location,
        totalRooms: rooms.length,
        availableRooms: availableCount,
        bookedRooms: bookedCount,
        rooms: rooms
      };
    });
    
    console.log('Sending availability response with', availability.length, 'properties');
    console.log('========================================');
    res.json(availability);
  } catch (err) {
    console.error('Error in availability route:', err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
});

// Create booking from client check-in
router.post('/from-client/:clientId', async function(req, res) {
  try {
    const client = await Client.findById(req.params.clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    console.log('Creating booking for client:', client.name);
    
    // Check if booking already exists for this date range
    const existingBooking = await Booking.findOne({
      propertyId: client.propertyId,
      roomNumber: client.roomNumber,
      status: { $in: ['Confirmed', 'Checked-in'] },
      $or: [
        { 
          $and: [
            { checkInDate: { $lte: client.checkOutDate } }, 
            { checkOutDate: { $gte: client.checkInDate } }
          ]
        }
      ]
    });
    
    if (existingBooking) {
      return res.status(400).json({ message: 'Room already booked for these dates' });
    }
    
    const daysCount = getDaysBetween(client.checkInDate, client.checkOutDate);
    const totalAmount = (client.rate || 0) * daysCount;
    
    const booking = new Booking({
      clientId: client._id,
      clientName: client.name,
      propertyId: client.propertyId,
      propertyName: client.propertyName,
      roomNumber: client.roomNumber,
      roomName: client.roomName,
      checkInDate: client.checkInDate,
      checkOutDate: client.checkOutDate,
      status: 'Confirmed',
      totalAmount: totalAmount,
      paidAmount: client.paidAmount || 0,
      dueAmount: (totalAmount - (client.paidAmount || 0))
    });
    
    const saved = await booking.save();
    console.log('Booking created successfully:', saved._id);
    res.json(saved);
  } catch (err) {
    console.error('Error creating booking from client:', err);
    res.status(400).json({ message: err.message });
  }
});

// Create direct booking
router.post('/', async function(req, res) {
  try {
    console.log('Creating direct booking:', req.body);
    
    // Calculate total amount if not provided
    if (!req.body.totalAmount && req.body.rate && req.body.checkInDate && req.body.checkOutDate) {
      const daysCount = getDaysBetween(req.body.checkInDate, req.body.checkOutDate);
      req.body.totalAmount = req.body.rate * daysCount;
    }
    
    // Calculate due amount
    if (req.body.totalAmount && req.body.paidAmount !== undefined) {
      req.body.dueAmount = req.body.totalAmount - req.body.paidAmount;
    }
    
    const booking = new Booking(req.body);
    const saved = await booking.save();
    console.log('Booking created:', saved._id);
    res.json(saved);
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update booking
router.put('/:id', async function(req, res) {
  try {
    console.log('Updating booking:', req.params.id);
    
    // Recalculate amounts if rate or dates changed
    if (req.body.rate || req.body.checkInDate || req.body.checkOutDate || req.body.paidAmount !== undefined) {
      const existing = await Booking.findById(req.params.id);
      if (existing) {
        const rate = req.body.rate || existing.rate;
        const checkInDate = req.body.checkInDate || existing.checkInDate;
        const checkOutDate = req.body.checkOutDate || existing.checkOutDate;
        const paidAmount = req.body.paidAmount !== undefined ? req.body.paidAmount : existing.paidAmount;
        
        if (rate && checkInDate && checkOutDate) {
          const daysCount = getDaysBetween(checkInDate, checkOutDate);
          req.body.totalAmount = rate * daysCount;
          req.body.dueAmount = req.body.totalAmount - paidAmount;
        }
      }
    }
    
    var updated = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    console.log('Booking updated:', updated._id);
    res.json(updated);
  } catch (err) {
    console.error('Error updating booking:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete booking
router.delete('/:id', async function(req, res) {
  try {
    console.log('Deleting booking:', req.params.id);
    await Booking.findByIdAndDelete(req.params.id);
    console.log('Booking deleted');
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('Error deleting booking:', err);
    res.status(500).json({ message: err.message });
  }
});

// Debug route to check all data
router.get('/debug/all', async function(req, res) {
  try {
    const properties = await Property.find();
    const bookings = await Booking.find();
    const clients = await Client.find();
    
    res.json({
      properties: {
        count: properties.length,
        data: properties.map(p => ({
          id: p._id,
          name: p.name,
          roomCount: p.rooms?.length || 0
        }))
      },
      bookings: {
        count: bookings.length,
        data: bookings.map(b => ({
          id: b._id,
          client: b.clientName,
          room: b.roomName,
          dates: `${b.checkInDate} to ${b.checkOutDate}`
        }))
      },
      clients: {
        count: clients.length
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function
function getDaysBetween(startDate, endDate) {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 1;
}

module.exports = router;