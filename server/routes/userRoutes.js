import express from 'express';
import { getDatabase } from '../config/databases.js';
import { getDatabaseModel } from '../models/dynamicUserModel.js';

const router = express.Router();

// Get users who requested payment but didn't complete purchase
router.get('/pending', async (req, res) => {
  try {
    // Get database key from query parameter (default to 'bot-win-2')
    const dbKey = req.query.database || 'bot-win-2';
    const dbConfig = getDatabase(dbKey);
    
    if (!dbConfig) {
      return res.status(404).json({ error: 'Database not found' });
    }
    
    // Get the appropriate model for this database
    const UserModel = await getDatabaseModel(dbConfig);
    
    const users = await UserModel.find({
      $and: [
        {
          $or: [{ estado: { $nin: ["bienvenida", "pagado", "respondido", "vsl"] } }],
        }
      ]
    })
    .lean() // Use lean() for better performance
    .sort({ medio_at: -1 })
    .exec(); // Use exec() to ensure proper promise handling
    
    res.json({
      users,
      database: dbConfig.name,
      collection: dbConfig.collection,
      count: users.length
    });
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
    const { phoneNumber, database } = req.body;
    
    // Get database configuration
    const dbKey = database || 'bot-win-2';
    const dbConfig = getDatabase(dbKey);
    
    if (!dbConfig) {
      return res.status(404).json({ error: 'Database not found' });
    }
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // Get the appropriate model for this database
    const UserModel = await getDatabaseModel(dbConfig);
    
    const result = await UserModel.updateOne(
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