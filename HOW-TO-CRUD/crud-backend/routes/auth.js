const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Login Route - Only checks UserID, no password check for now
router.post('/login', async (req, res) => {
  const { UserID, password } = req.body;

  console.log('Login attempt:', { UserID });
  console.log('Request body:', req.body);

  try {
    // First, let's check if UserID is provided
    if (!UserID) {
      console.log('No UserID provided');
      return res.status(400).json({ message: 'UserID is required' });
    }

    // Find user by UserID
    const user = await User.findOne({ UserID: UserID });
    
    console.log('Query result:', user);
    
    if (!user) {
      console.log('User not found for UserID:', UserID);
      
      // Let's check what users exist in the database
      const allUsers = await User.find({}).select('UserID FirstName LastName');
      console.log('All users in database:', allUsers);
      
      return res.status(401).json({ 
        message: 'Invalid UserID',
        debug: `UserID '${UserID}' not found` 
      });
    }

    console.log('User found:', {
      UserID: user.UserID,
      FirstName: user.FirstName,
      LastName: user.LastName,
      UserGroup: user.UserGroup
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        UserID: user.UserID, 
        UserGroup: user.UserGroup 
      }, 
      process.env.JWT_SECRET || 'your-secret-key', 
      { expiresIn: '1d' }
    );

    // Send response with user info
    res.json({
      success: true,
      token,
      user: {
        UserID: user.UserID,
        FirstName: user.FirstName,
        LastName: user.LastName,
        UserGroup: user.UserGroup,
        CreateDate: user.CreateDate
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: err.message 
    });
  }
});

// Debug route to see all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('UserID FirstName LastName UserGroup');
    res.json({
      count: users.length,
      users: users
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working' });
});

module.exports = router;