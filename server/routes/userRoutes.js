import express from 'express';
import Ebook from '../models/userModel.js';

const router = express.Router();

// Get users who requested payment but didn't complete purchase
router.get('/pending', async (req, res) => {
  try {
    const users = await Ebook.find({
      $and: [
        {
          $or: [{ estado: { $nin: ["bienvenida", "pagado", "respondido", "vsl"] } }],
        }
      ]
    })
    .lean() // Use lean() for better performance
    .sort({ medio_at: -1 })
    .exec(); // Use exec() to ensure proper promise handling
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message 
    });
  }
});

// Mark message as sent
router.post('/mark-sent', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    const result = await Ebook.updateOne(
      { whatsapp: phoneNumber },
      { $set: { enviado: true } }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as sent:', error);
    res.status(500).json({ 
      error: 'Failed to update user',
      details: error.message 
    });
  }
});

export default router;