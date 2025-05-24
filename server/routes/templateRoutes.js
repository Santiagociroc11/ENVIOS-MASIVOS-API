import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Fetch templates from Meta Graph API
router.get('/', async (req, res) => {
  try {
    // Check if required environment variables are set
    if (!process.env.META_ACCESS_TOKEN || !process.env.WHATSAPP_BUSINESS_ACCOUNT_ID) {
      return res.status(500).json({ 
        error: 'Environment variables not configured', 
        details: 'META_ACCESS_TOKEN and WHATSAPP_BUSINESS_ACCOUNT_ID are required'
      });
    }

    const response = await axios.get(
      `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
      {
        headers: {
          Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`
        }
      }
    );
    
    res.json(response.data.data || []);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch templates from WhatsApp API', 
      details: error.response?.data || error.message 
    });
  }
});

export default router;