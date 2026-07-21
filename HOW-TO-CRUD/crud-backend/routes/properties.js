var express = require('express');
var Property = require('../models/propertyModel');

var router = express.Router();

router.get('/', async function(req, res) {
  try {
    var properties = await Property.find();
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async function(req, res) {
  try {
    var newProperty = new Property(req.body);
    var saved = await newProperty.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async function(req, res) {
  try {
    var updated = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async function(req, res) {
  try {
    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: 'Property deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
