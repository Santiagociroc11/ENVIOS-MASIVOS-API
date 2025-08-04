import express from 'express';
import { getAllDatabases, getDatabase } from '../config/databases.js';
import { getDatabaseModel } from '../models/dynamicUserModel.js';

const router = express.Router();

// Get all available databases
router.get('/', (req, res) => {
  try {
    const databases = getAllDatabases();
    res.json(databases);
  } catch (error) {
    console.error('Error fetching databases:', error);
    res.status(500).json({ 
      error: 'Failed to fetch databases',
      details: error.message 
    });
  }
});

// Test database connection
router.post('/test/:dbKey', async (req, res) => {
  try {
    const { dbKey } = req.params;
    const dbConfig = getDatabase(dbKey);
    
    if (!dbConfig) {
      return res.status(404).json({ error: 'Database not found' });
    }
    
    // Try to connect and get a count
    const Model = await getDatabaseModel(dbConfig);
    const count = await Model.countDocuments();
    
    res.json({ 
      success: true, 
      database: dbConfig.name,
      collection: dbConfig.collection,
      userCount: count,
      message: 'Connection successful' 
    });
    
  } catch (error) {
    console.error('Error testing database connection:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to connect to database',
      details: error.message 
    });
  }
});

export default router;