import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { getDatabase } from '../config/databases.js';
import { getDatabaseModel } from '../models/dynamicUserModel.js';
import ConfiguredTemplate from '../models/configuredTemplateModel.js';

dotenv.config();

const router = express.Router();

// Webhook endpoint for WhatsApp status updates
router.get('/webhook', (req, res) => {
  // Verify webhook (required by Meta)
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && (token === process.env.WEBHOOK_VERIFY_TOKEN || 'whatsapp_webhook_token')) {
      // Respond with 200 OK and challenge token from the request
      console.log('✅ Webhook verified successfully!');
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Webhook endpoint for receiving status updates
router.post('/webhook', (req, res) => {
  try {
    const body = req.body;
    
    // Check if this is a WhatsApp status update
    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach(entry => {
        entry.changes?.forEach(change => {
          if (change.field === 'messages') {
            const value = change.value;
            
            // Handle message status updates
            if (value.statuses) {
              value.statuses.forEach(status => {
                console.log('📱 Message Status Update:', {
                  messageId: status.id,
                  status: status.status,
                  timestamp: status.timestamp,
                  recipientId: status.recipient_id,
                  errors: status.errors
                });
                
                // Here you could update your database with delivery status
                // updateMessageStatus(status.id, status.status);
              });
            }
            
            // Handle incoming messages (replies)
            if (value.messages) {
              value.messages.forEach(message => {
                console.log('📨 Incoming Message:', {
                  from: message.from,
                  messageId: message.id,
                  timestamp: message.timestamp,
                  type: message.type,
                  text: message.text?.body
                });
              });
            }
          }
        });
      });
    }
    
    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).send('ERROR');
  }
});

// Get message delivery status
router.get('/status/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    if (!messageId) {
      return res.status(400).json({ error: 'Message ID is required' });
    }
    
    // Try to get message status from WhatsApp API
    const response = await axios.get(
      `https://graph.facebook.com/v17.0/${messageId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`
        }
      }
    );
    
    res.json({
      success: true,
      messageId: messageId,
      status: response.data
    });
    
  } catch (error) {
    console.error('Error getting message status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get message status',
      details: error.response?.data || error.message
    });
  }
});

// Send test template message (for testing purposes - doesn't require user to be in database)
router.post('/send-test', async (req, res) => {
  try {
    const { phoneNumber, templateName } = req.body;
    
    console.log('🧪 === SENDING TEST MESSAGE ===');
    console.log('📱 Test Number:', phoneNumber);
    console.log('📋 Template:', templateName);
    console.log('===============================');
    
    if (!phoneNumber || !templateName) {
      console.log('❌ VALIDATION ERROR: Missing required fields');
      console.log('📱 phoneNumber:', phoneNumber);
      console.log('📋 templateName:', templateName);
      return res.status(400).json({ 
        success: false,
        error: 'Phone number and template name are required' 
      });
    }

    console.log('🔍 === VALIDATING ENVIRONMENT VARIABLES ===');
    console.log('🔑 META_ACCESS_TOKEN exists:', !!process.env.META_ACCESS_TOKEN);
    console.log('📞 FROM_PHONE_NUMBER_ID exists:', !!process.env.FROM_PHONE_NUMBER_ID);
    console.log('🏢 WHATSAPP_BUSINESS_ACCOUNT_ID exists:', !!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID);
    console.log('🔑 META_ACCESS_TOKEN (first 20 chars):', process.env.META_ACCESS_TOKEN?.substring(0, 20) + '...');
    console.log('📞 FROM_PHONE_NUMBER_ID:', process.env.FROM_PHONE_NUMBER_ID);
    console.log('🏢 WHATSAPP_BUSINESS_ACCOUNT_ID:', process.env.WHATSAPP_BUSINESS_ACCOUNT_ID);
    console.log('=============================================');

    // Check if required environment variables are set
    if (!process.env.META_ACCESS_TOKEN || !process.env.FROM_PHONE_NUMBER_ID) {
      return res.status(500).json({ 
        success: false,
        error: 'Environment variables not configured',
        details: 'META_ACCESS_TOKEN and FROM_PHONE_NUMBER_ID are required'
      });
    }
    
    // Get configured template details
    const configuredTemplate = await ConfiguredTemplate.findOne({ 
      templateName: templateName,
      isActive: true 
    });
    
    if (!configuredTemplate) {
      return res.status(404).json({ 
        success: false,
        error: 'Configured template not found or inactive' 
      });
    }
    
    const templateMessage = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: configuredTemplate.language
        }
      }
    };

    // Build components based on template structure
    try {
      const components = [];
      
      // Add media component if configured
      if (configuredTemplate.mediaUrl && configuredTemplate.mediaType) {
        console.log('🎯 Adding media component:', configuredTemplate.mediaType, configuredTemplate.mediaUrl);
        
        if (configuredTemplate.mediaType === 'video') {
          components.push({
            type: "header",
            parameters: [
              {
                type: "video",
                video: {
                  link: configuredTemplate.mediaUrl
                }
              }
            ]
          });
        } else if (configuredTemplate.mediaType === 'image') {
          components.push({
            type: "header",
            parameters: [
              {
                type: "image",
                image: {
                  link: configuredTemplate.mediaUrl
                }
              }
            ]
          });
        } else if (configuredTemplate.mediaType === 'document') {
          components.push({
            type: "header",
            parameters: [
              {
                type: "document",
                document: {
                  link: configuredTemplate.mediaUrl,
                  filename: "documento.pdf"
                }
              }
            ]
          });
        }
      }
      
      // Add other parameters if configured
      if (configuredTemplate.headerText && configuredTemplate.headerText.length > 0) {
        const headerParams = configuredTemplate.headerText.map(text => ({
          type: "text",
          text: text
        }));
        
        components.push({
          type: "header",
          parameters: headerParams
        });
      }
      
      if (configuredTemplate.bodyText && configuredTemplate.bodyText.length > 0) {
        const bodyParams = configuredTemplate.bodyText[0].map(text => ({
          type: "text",
          text: text
        }));
        
        components.push({
          type: "body",
          parameters: bodyParams
        });
      }
      
      console.log('✅ Built components from configured template:', JSON.stringify(components, null, 2));
      
      if (components.length > 0) {
        templateMessage.template.components = components;
      }
    } catch (templateError) {
      console.warn('⚠️ Error building template components:', templateError.message);
    }

    console.log('📤 Final test template message:', JSON.stringify(templateMessage, null, 2));

    // Log the complete API request details
    const apiUrl = `https://graph.facebook.com/v17.0/${process.env.FROM_PHONE_NUMBER_ID}/messages`;
    const headers = {
      Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    console.log('🌐 === WHATSAPP API REQUEST DETAILS (TEST) ===');
    console.log('📍 URL:', apiUrl);
    console.log('🔑 Headers:', {
      ...headers,
      Authorization: `Bearer ${process.env.META_ACCESS_TOKEN?.substring(0, 20)}...` // Hide full token
    });
    console.log('📦 Request Body (JSON):', JSON.stringify(templateMessage, null, 2));
    console.log('📏 Body Size:', JSON.stringify(templateMessage).length, 'characters');
    console.log('🎯 FROM_PHONE_NUMBER_ID:', process.env.FROM_PHONE_NUMBER_ID);
    console.log('📱 TO:', phoneNumber);
    console.log('📋 Template Name:', templateName);
    console.log('🌍 Language:', templateMessage.template.language.code);
    console.log('🔧 Components Count:', templateMessage.template.components?.length || 0);
    console.log('📦 COMPLETE REQUEST BODY:');
    console.log(JSON.stringify(templateMessage, null, 2));
    console.log('==========================================');

    const response = await axios.post(
      apiUrl,
      templateMessage,
      { headers }
    );
    
    console.log('✅ === WHATSAPP API RESPONSE (TEST) ===');
    console.log('✅ WhatsApp API Response:', response.data);
    console.log('📊 Response Status:', response.status);
    console.log('📨 Message ID:', response.data.messages?.[0]?.id);
    console.log('👤 Contact Info:', response.data.contacts?.[0]);
    console.log('===================================');
    
    // Note: For test messages, we don't update any database records
    
    res.json({ 
      success: true,
      messageId: response.data.messages?.[0]?.id,
      whatsappResponse: {
        messageId: response.data.messages?.[0]?.id,
        contacts: response.data.contacts,
        messagingProduct: response.data.messaging_product
      },
      diagnostics: {
        phoneNumber: phoneNumber,
        templateName: templateName,
        fromPhoneNumberId: process.env.FROM_PHONE_NUMBER_ID,
        timestamp: new Date().toISOString(),
        templateComponents: templateMessage.template.components ? templateMessage.template.components.length : 0,
        finalMessage: templateMessage,
        isTestMessage: true
      }
    });
  } catch (error) {
    console.error('Error sending test template message:', error);
    
    // Log detailed error information
    console.log('❌ === WHATSAPP API ERROR DETAILS (TEST) ===');
    console.log('🚨 Error Type:', error.name);
    console.log('📄 Error Message:', error.message);
    console.log('📊 Response Status:', error.response?.status);
    console.log('📋 Response Headers:', error.response?.headers);
    console.log('📦 Response Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('🔗 Request URL:', error.config?.url);
    console.log('📤 Request Method:', error.config?.method?.toUpperCase());
    console.log('📦 Request Data:', error.config?.data);
    console.log('=============================================');
    
    // Extract specific WhatsApp error message
    let errorMessage = 'Failed to send test message';
    let errorDetails = error.message;
    
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error.message || errorMessage;
      errorDetails = error.response.data.error;
      
      console.error('📱 WhatsApp API Error Details:', {
        message: errorMessage,
        details: errorDetails,
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.response?.headers?.['www-authenticate']) {
      // Extract error from www-authenticate header
      const authHeader = error.response.headers['www-authenticate'];
      const match = authHeader.match(/"([^"]*)"$/);
      if (match) {
        errorMessage = match[1];
      }
    }
    
    // Handle specific WhatsApp errors with helpful messages
    if (errorMessage.includes('Parameter format does not match format in the created template')) {
      errorMessage = `❌ Los parámetros de la plantilla "${templateName}" no coinciden con la estructura esperada.`;
      errorDetails = {
        originalError: errorMessage,
        templateUsed: templateName,
        solution: 'La plantilla requiere parámetros específicos (video, texto, botones)',
        steps: [
          '1. Verifica que la plantilla esté configurada correctamente',
          '2. Revisa que los componentes multimedia estén disponibles',
          '3. Confirma que los botones tengan la estructura correcta',
          '4. Verifica que el formato de parámetros sea el esperado'
        ],
        templateStructure: 'La plantilla parece requerir: HEADER (video), BODY (texto), FOOTER (texto), BUTTONS (quick_reply)',
        documentation: 'https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates'
      };
    } else if (errorMessage.includes('Template name does not exist in the translation')) {
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
    
    console.error('📱 WhatsApp API Error (Test):', errorMessage);
    
    res.status(500).json({ 
      success: false,
      error: errorMessage,
      details: errorDetails
    });
  }
});

// Send template message
router.post('/send', async (req, res) => {
  try {
    const { phoneNumber, templateName, databases } = req.body;
    
    // Get database configurations
    const dbKeys = databases || ['bot-win-4'];
    const dbKeysArray = Array.isArray(dbKeys) ? dbKeys : [dbKeys];
    
    console.log('📱 Enviando mensaje a:', phoneNumber, 'con plantilla:', templateName, 'desde DBs:', dbKeysArray);
    
    if (!phoneNumber || !templateName) {
      console.log('❌ VALIDATION ERROR: Missing required fields');
      console.log('📱 phoneNumber:', phoneNumber);
      console.log('📋 templateName:', templateName);
      return res.status(400).json({ 
        success: false,
        error: 'Phone number and template name are required' 
      });
    }

    console.log('🔍 === VALIDATING ENVIRONMENT VARIABLES ===');
    console.log('🔑 META_ACCESS_TOKEN exists:', !!process.env.META_ACCESS_TOKEN);
    console.log('📞 FROM_PHONE_NUMBER_ID exists:', !!process.env.FROM_PHONE_NUMBER_ID);
    console.log('🏢 WHATSAPP_BUSINESS_ACCOUNT_ID exists:', !!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID);
    console.log('🔑 META_ACCESS_TOKEN (first 20 chars):', process.env.META_ACCESS_TOKEN?.substring(0, 20) + '...');
    console.log('📞 FROM_PHONE_NUMBER_ID:', process.env.FROM_PHONE_NUMBER_ID);
    console.log('🏢 WHATSAPP_BUSINESS_ACCOUNT_ID:', process.env.WHATSAPP_BUSINESS_ACCOUNT_ID);
    console.log('=============================================');

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
    // Build template message with parameters support
    
    // Get configured template details
    const configuredTemplate = await ConfiguredTemplate.findOne({ 
      templateName: templateName,
      isActive: true 
    });
    
    if (!configuredTemplate) {
      return res.status(404).json({ 
        success: false,
        error: 'Configured template not found or inactive' 
      });
    }
    
    const templateMessage = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: configuredTemplate.language
        }
      }
    };

    // Build components based on template structure
    try {
      const components = [];
      
      // Add media component if configured
      if (configuredTemplate.mediaUrl && configuredTemplate.mediaType) {
        console.log('🎯 Adding media component:', configuredTemplate.mediaType, configuredTemplate.mediaUrl);
        
        if (configuredTemplate.mediaType === 'video') {
          components.push({
            type: "header",
            parameters: [
              {
                type: "video",
                video: {
                  link: configuredTemplate.mediaUrl
                }
              }
            ]
          });
        } else if (configuredTemplate.mediaType === 'image') {
          components.push({
            type: "header",
            parameters: [
              {
                type: "image",
                image: {
                  link: configuredTemplate.mediaUrl
                }
              }
            ]
          });
        } else if (configuredTemplate.mediaType === 'document') {
          components.push({
            type: "header",
            parameters: [
              {
                type: "document",
                document: {
                  link: configuredTemplate.mediaUrl,
                  filename: "documento.pdf"
                }
              }
            ]
          });
        }
      }
      
      // Add other parameters if configured
      if (configuredTemplate.headerText && configuredTemplate.headerText.length > 0) {
        const headerParams = configuredTemplate.headerText.map(text => ({
          type: "text",
          text: text
        }));
        
        components.push({
          type: "header",
          parameters: headerParams
        });
      }
      
      if (configuredTemplate.bodyText && configuredTemplate.bodyText.length > 0) {
        const bodyParams = configuredTemplate.bodyText[0].map(text => ({
          type: "text",
          text: text
        }));
        
        components.push({
          type: "body",
          parameters: bodyParams
        });
      }
      
      console.log('✅ Built components from configured template:', JSON.stringify(components, null, 2));
      
      if (components.length > 0) {
        templateMessage.template.components = components;
      }
    } catch (templateError) {
      console.warn('⚠️ Error building template components:', templateError.message);
    }

    console.log('📤 Final template message:', JSON.stringify(templateMessage, null, 2));

    // Log the complete API request details
    const apiUrl = `https://graph.facebook.com/v17.0/${process.env.FROM_PHONE_NUMBER_ID}/messages`;
    const headers = {
      Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    console.log('🌐 === WHATSAPP API REQUEST DETAILS ===');
    console.log('📍 URL:', apiUrl);
    console.log('🔑 Headers:', {
      ...headers,
      Authorization: `Bearer ${process.env.META_ACCESS_TOKEN?.substring(0, 20)}...` // Hide full token
    });
    console.log('📦 Request Body (JSON):', JSON.stringify(templateMessage, null, 2));
    console.log('📏 Body Size:', JSON.stringify(templateMessage).length, 'characters');
    console.log('🎯 FROM_PHONE_NUMBER_ID:', process.env.FROM_PHONE_NUMBER_ID);
    console.log('📱 TO:', phoneNumber);
    console.log('📋 Template Name:', templateName);
    console.log('🌍 Language:', templateMessage.template.language.code);
    console.log('🔧 Components Count:', templateMessage.template.components?.length || 0);
    console.log('📦 COMPLETE REQUEST BODY:');
    console.log(JSON.stringify(templateMessage, null, 2));
    console.log('==========================================');


    const response = await axios.post(
      apiUrl,
      templateMessage,
      { headers }
    );
    
    console.log('✅ === WHATSAPP API RESPONSE ===');
    console.log('✅ WhatsApp API Response:', response.data);
    console.log('📊 Response Status:', response.status);
    console.log('📨 Message ID:', response.data.messages?.[0]?.id);
    console.log('👤 Contact Info:', response.data.contacts?.[0]);
    console.log('================================');
    
    // Mark the user as messaged with complete data
    if (sourceDatabase) {
      try {
        const UserModel = await getDatabaseModel(sourceDatabase.config);
        const currentTimestamp = Math.floor(Date.now() / 1000);
        
        const updateData = {
          enviado: true,
          plantilla_enviada: templateName || 'plantilla-desconocida',
          plantilla_at: currentTimestamp
        };
        
        console.log('📝 Actualizando usuario con datos completos:', updateData);
        
        await UserModel.updateOne(
          { whatsapp: phoneNumber },
          { $set: updateData }
        );
        
        console.log('✅ Usuario marcado como enviado con plantilla_at:', currentTimestamp);
      } catch (updateError) {
        console.error('Error updating user after sending message:', updateError);
        // Don't fail the request if the update fails, the message was sent successfully
      }
    }
    
    res.json({ 
      success: true,
      messageId: response.data.messages?.[0]?.id,
      sourceDatabase: sourceDatabase?.key,
      whatsappResponse: {
        messageId: response.data.messages?.[0]?.id,
        contacts: response.data.contacts,
        messagingProduct: response.data.messaging_product
      },
      diagnostics: {
        phoneNumber: phoneNumber,
        templateName: templateName,
        fromPhoneNumberId: process.env.FROM_PHONE_NUMBER_ID,
        timestamp: new Date().toISOString(),
        templateComponents: templateMessage.template.components ? templateMessage.template.components.length : 0,
        finalMessage: templateMessage
      }
    });
  } catch (error) {
    console.error('Error sending template message:', error);
    
    // Log detailed error information
    console.log('❌ === WHATSAPP API ERROR DETAILS ===');
    console.log('🚨 Error Type:', error.name);
    console.log('📄 Error Message:', error.message);
    console.log('📊 Response Status:', error.response?.status);
    console.log('📋 Response Headers:', error.response?.headers);
    console.log('📦 Response Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('🔗 Request URL:', error.config?.url);
    console.log('📤 Request Method:', error.config?.method?.toUpperCase());
    console.log('📦 Request Data:', error.config?.data);
    console.log('=====================================');
    
    // Extract specific WhatsApp error message
    let errorMessage = 'Failed to send message';
    let errorDetails = error.message;
    
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error.message || errorMessage;
      errorDetails = error.response.data.error;
      
      console.error('📱 WhatsApp API Error Details:', {
        message: errorMessage,
        details: errorDetails,
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.response?.headers?.['www-authenticate']) {
      // Extract error from www-authenticate header
      const authHeader = error.response.headers['www-authenticate'];
      const match = authHeader.match(/"([^"]*)"$/);
      if (match) {
        errorMessage = match[1];
      }
    }
    
    // Handle specific WhatsApp errors with helpful messages
    if (errorMessage.includes('Parameter format does not match format in the created template')) {
      errorMessage = `❌ Los parámetros de la plantilla "${templateName}" no coinciden con la estructura esperada.`;
      errorDetails = {
        originalError: errorMessage,
        templateUsed: templateName,
        solution: 'La plantilla requiere parámetros específicos (video, texto, botones)',
        steps: [
          '1. Verifica que la plantilla esté configurada correctamente',
          '2. Revisa que los componentes multimedia estén disponibles',
          '3. Confirma que los botones tengan la estructura correcta',
          '4. Verifica que el formato de parámetros sea el esperado'
        ],
        templateStructure: 'La plantilla parece requerir: HEADER (video), BODY (texto), FOOTER (texto), BUTTONS (quick_reply)',
        documentation: 'https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates'
      };
    } else if (errorMessage.includes('Template name does not exist in the translation')) {
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