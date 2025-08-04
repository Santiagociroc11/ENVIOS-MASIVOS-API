import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { getDatabase } from '../config/databases.js';
import { getDatabaseModel } from '../models/dynamicUserModel.js';

dotenv.config();

const router = express.Router();

// Send template message
router.post('/send', async (req, res) => {
  try {
    const { phoneNumber, templateName, database } = req.body;
    
    // Get database configuration
    const dbKey = database || 'bot-win-2';
    const dbConfig = getDatabase(dbKey);
    
    if (!dbConfig) {
      return res.status(404).json({ 
        success: false,
        error: 'Database not found' 
      });
    }
    
    console.log('🔍 Debug - Variables de entorno en messageRoutes:');
    console.log('META_ACCESS_TOKEN:', process.env.META_ACCESS_TOKEN ? 'Configurado' : 'NO ENCONTRADO');
    console.log('FROM_PHONE_NUMBER_ID:', process.env.FROM_PHONE_NUMBER_ID ? 'Configurado' : 'NO ENCONTRADO');
    console.log('📱 Enviando mensaje a:', phoneNumber, 'con plantilla:', templateName, 'desde DB:', dbConfig.name);
    
    if (!phoneNumber || !templateName) {
      return res.status(400).json({ 
        success: false,
        error: 'Phone number and template name are required' 
      });
    }


    // Check if required environment variables are set
    if (!process.env.META_ACCESS_TOKEN || !process.env.FROM_PHONE_NUMBER_ID) {
      return res.status(500).json({ 
        success: false,
        error: 'Environment variables not configured',
        details: 'META_ACCESS_TOKEN and FROM_PHONE_NUMBER_ID are required'
      });
    }
    
    // Get the appropriate model for this database
    const UserModel = await getDatabaseModel(dbConfig);
    
    // Get the user to make sure they exist
    const user = await UserModel.findOne({ whatsapp: phoneNumber });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    // Send message using the Meta Graph API
    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${process.env.FROM_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phoneNumber,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: "es"
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Mark the user as messaged
    await UserModel.updateOne(
      { whatsapp: phoneNumber },
      { $set: { enviado: true } }
    );
    
    res.json({ 
      success: true,
      messageId: response.data.messages?.[0]?.id
    });
  } catch (error) {
    console.error('Error sending template message:', error);
    
    // Extract specific WhatsApp error message
    let errorMessage = 'Failed to send message';
    let errorDetails = error.message;
    
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error.message || errorMessage;
      errorDetails = error.response.data.error;
    } else if (error.response?.headers?.['www-authenticate']) {
      // Extract error from www-authenticate header
      const authHeader = error.response.headers['www-authenticate'];
      const match = authHeader.match(/"([^"]*)"$/);
      if (match) {
        errorMessage = match[1];
      }
    }
    
    // Handle specific WhatsApp errors with helpful messages
    if (errorMessage.includes('Hello World templates can only be sent from the Public Test Numbers')) {
      errorMessage = 'La plantilla "hello_world" solo funciona con números de prueba. Necesitas crear una plantilla personalizada aprobada para tu número de producción.';
      errorDetails = {
        originalError: errorMessage,
        solution: 'Ve a Meta Business Manager > WhatsApp Manager > Message Templates y crea una plantilla personalizada',
        documentation: 'https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates'
      };
    }
    
    console.error('📱 WhatsApp API Error:', errorMessage);
    
    res.status(500).json({ 
      success: false,
      error: errorMessage,
      details: errorDetails
    });
  }
});

export default router;