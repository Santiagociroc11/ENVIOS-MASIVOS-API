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
    const { phoneNumber, templateName, databases } = req.body;
    
    // Get database configurations
    const dbKeys = databases || ['bot-win-2'];
    const dbKeysArray = Array.isArray(dbKeys) ? dbKeys : [dbKeys];
    
    console.log('📱 Enviando mensaje a:', phoneNumber, 'con plantilla:', templateName, 'desde DBs:', dbKeysArray);
    
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
    
    // Find the user in any of the selected databases
    let user = null;
    let sourceDatabase = null;
    
    for (const dbKey of dbKeysArray) {
      const dbConfig = getDatabase(dbKey);
      
      if (!dbConfig) {
        console.warn(`Database ${dbKey} not found, skipping...`);
        continue;
      }
      
      try {
        // Get the appropriate model for this database
        const UserModel = await getDatabaseModel(dbConfig);
        
        // Try to find the user in this database
        const foundUser = await UserModel.findOne({ whatsapp: phoneNumber });
        
        if (foundUser) {
          user = foundUser;
          sourceDatabase = { key: dbKey, config: dbConfig };
          break; // Found the user, no need to check other databases
        }
        
      } catch (dbError) {
        console.error(`Error searching user in database ${dbKey}:`, dbError);
        // Continue searching in other databases
      }
    }
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found in any of the selected databases' 
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
    if (sourceDatabase) {
      try {
        const UserModel = await getDatabaseModel(sourceDatabase.config);
        await UserModel.updateOne(
          { whatsapp: phoneNumber },
          { $set: { enviado: true } }
        );
      } catch (updateError) {
        console.error('Error updating user after sending message:', updateError);
        // Don't fail the request if the update fails, the message was sent successfully
      }
    }
    
    res.json({ 
      success: true,
      messageId: response.data.messages?.[0]?.id,
      sourceDatabase: sourceDatabase?.key
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
    if (errorMessage.includes('Template name does not exist in the translation')) {
      errorMessage = `❌ La plantilla "${templateName}" no existe o no está aprobada en tu cuenta de WhatsApp Business.`;
      errorDetails = {
        originalError: errorMessage,
        templateUsed: templateName,
        solution: 'Verifica que la plantilla esté aprobada en Meta Business Manager',
        steps: [
          '1. Ve a Meta Business Manager > WhatsApp Manager',
          '2. Selecciona "Message Templates"',
          '3. Verifica que la plantilla esté en estado "APPROVED"',
          '4. Si no existe, créala y espera aprobación'
        ],
        documentation: 'https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates'
      };
    } else if (errorMessage.includes('Hello World templates can only be sent from the Public Test Numbers')) {
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