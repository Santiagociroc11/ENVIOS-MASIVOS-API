import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { getDatabase } from '../config/databases.js';
import { getDatabaseModel } from '../models/dynamicUserModel.js';

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

// Send template message
router.post('/send', async (req, res) => {
  try {
    const { phoneNumber, templateName, databases } = req.body;
    
    // Get database configurations
    const dbKeys = databases || ['bot-win-2'];
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
    const templateMessage = {
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
    };

    // Build components based on template structure
    try {
      // Find the template in our cached templates
      const templatesResponse = await axios.get(
        `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
        {
          headers: {
            Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`
          }
        }
      );
      
      const template = templatesResponse.data.data?.find(t => t.name === templateName);
      
      if (template && template.components) {
        const components = [];
        
        console.log('🎯 Processing template:', templateName);
        console.log('📋 Template components:', template.components);
        
        for (const component of template.components) {
          console.log('🔧 Processing component:', component.type, component.format);
          
          if (component.type === 'HEADER' && component.format) {
            if (component.format === 'VIDEO') {
              components.push({
                type: "header",
                parameters: [
                  {
                    type: "video",
                    video: {
                      link: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
                    }
                  }
                ]
              });
            } else if (component.format === 'IMAGE') {
              components.push({
                type: "header",
                parameters: [
                  {
                    type: "image",
                    image: {
                      link: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"
                    }
                  }
                ]
              });
            } else if (component.format === 'DOCUMENT') {
              components.push({
                type: "header",
                parameters: [
                  {
                    type: "document",
                    document: {
                      link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                      filename: "documento.pdf"
                    }
                  }
                ]
              });
            } else if (component.format === 'TEXT' && component.example?.header_text) {
              // Handle text headers with variables
              const headerParams = component.example.header_text.map(text => ({
                type: "text",
                text: text
              }));
              
              if (headerParams.length > 0) {
                components.push({
                  type: "header",
                  parameters: headerParams
                });
              }
            } else if (component.format === 'LOCATION') {
              components.push({
                type: "header",
                parameters: [
                  {
                    type: "location",
                    location: {
                      latitude: "4.7110",
                      longitude: "-74.0721",
                      name: "Bogotá, Colombia",
                      address: "Bogotá, Colombia"
                    }
                  }
                ]
              });
            }
          } else if (component.type === 'BODY') {
            // Handle body parameters if they exist
            if (component.example?.body_text && component.example.body_text[0]) {
              const bodyParams = component.example.body_text[0].map(text => ({
                type: "text",
                text: text
              }));
              
              if (bodyParams.length > 0) {
                components.push({
                  type: "body",
                  parameters: bodyParams
                });
              }
            }
            // If no parameters needed, don't add body component
          } else if (component.type === 'BUTTONS' && component.buttons) {
            // Handle interactive buttons - each button needs its own component
            component.buttons.forEach((button, index) => {
              if (button.type === 'QUICK_REPLY') {
                components.push({
                  type: "button",
                  sub_type: "quick_reply",
                  index: index.toString(),
                  parameters: [
                    {
                      type: "payload",
                      payload: `PAYLOAD_${index}`
                    }
                  ]
                });
              } else if (button.type === 'URL' && button.url) {
                // URL buttons with dynamic parameters
                if (button.example && button.example.length > 0) {
                  components.push({
                    type: "button",
                    sub_type: "url",
                    index: index.toString(),
                    parameters: [
                      {
                        type: "text",
                        text: button.example[0] || "default"
                      }
                    ]
                  });
                }
              }
              // PHONE_NUMBER buttons don't need parameters
            });
          }
        }
        
        console.log('✅ Built components:', JSON.stringify(components, null, 2));
        
        if (components.length > 0) {
          templateMessage.template.components = components;
        }
      } else {
        console.warn('⚠️ Template not found or has no components:', templateName);
      }
    } catch (templateError) {
      console.warn('⚠️ Could not fetch template details, using basic structure:', templateError.message);
      
      // Fallback: Add basic video header for multimedia templates
      templateMessage.template.components = [
        {
          type: "header",
          parameters: [
            {
              type: "video",
              video: {
                link: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
              }
            }
          ]
        }
      ];
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