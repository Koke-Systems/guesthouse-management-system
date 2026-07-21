var express = require('express');
var Room = require('../models/roomModel');

var router = express.Router();

router.get('/', async function(req, res) {
  try {
    var rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async function(req, res) {
  try {
    var newRoom = new Room(req.body);
    var saved = await newRoom.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
 
router.get('/availability-summary', async (req, res) => {
  try {
    const summary = await Room.aggregate([
      {
        $addFields: {
          occupiedNormalized: {
            $cond: {
              if: { $ne: ["$occupied", undefined] },
              then: "$occupied",
              else: "$isOccupied"
            }
          }
        }
      },
      {
        $group: {
          _id: { propertyId: "$propertyId", type: "$type" },
          total: { $sum: 1 },
          available: {
            $sum: {
              $cond: [{ $eq: ["$occupiedNormalized", false] }, 1, 0]
            }
          },
          occupied: {
            $sum: {
              $cond: [{ $eq: ["$occupiedNormalized", true] }, 1, 0]
            }
          }
        }
      },
      {
        $group: {
          _id: "$_id.propertyId",
          roomTypes: {
            $push: {
              type: "$_id.type",
              availability: {
                available: "$available",
                occupied: "$occupied"
              }
            }
          },
          totalRooms: { $sum: "$total" },
          availableRooms: { $sum: "$available" },
          occupiedRooms: { $sum: "$occupied" }
        }
      },
      {
        $lookup: {
          from: "properties",       // your Property collection name
          localField: "_id",
          foreignField: "_id",
          as: "propertyInfo"
        }
      },
      { $unwind: "$propertyInfo" },
      {
        $project: {
          _id: 0,
          propertyId: "$_id",
          totalRooms: 1,
          availableRooms: 1,
          occupiedRooms: 1,
          roomTypes: 1,
          propertyName: "$propertyInfo.name",
          location: "$propertyInfo.location"
        }
      }
    ]);

    res.json(summary);
  } catch (err) {
    console.error("Error fetching availability summary:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});





router.put('/:id', async function(req, res) {
  try {
    var updated = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async function(req, res) {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
