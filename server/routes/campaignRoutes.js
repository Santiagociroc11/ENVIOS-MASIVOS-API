import express from 'express';
import Campaign from '../models/campaignModel.js';
import { getDatabase } from '../config/databases.js';
import { getDatabaseModel } from '../models/dynamicUserModel.js';

const router = express.Router();

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ 
      error: 'Failed to fetch campaigns',
      details: error.message 
    });
  }
});

// Get campaign details with current user stats
router.get('/:campaignId/details', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Get current stats of users who received messages in this campaign
    const userStats = {
      total: campaign.sentUsers.length,
      byEstado: {},
      byMedio: {},
      enviado: 0,
      noEnviado: 0
    };
    
    // Check current status of each user in their respective databases
    for (const sentUser of campaign.sentUsers) {
      try {
        const dbConfig = getDatabase(sentUser.database);
        if (!dbConfig) continue;
        
        const UserModel = await getDatabaseModel(dbConfig);
        const currentUser = await UserModel.findOne({ whatsapp: sentUser.whatsapp });
        
        if (currentUser) {
          // Count by estado
          const estado = currentUser.estado || 'sin-estado';
          userStats.byEstado[estado] = (userStats.byEstado[estado] || 0) + 1;
          
          // Count by medio
          const medio = currentUser.medio || 'sin-medio';
          userStats.byMedio[medio] = (userStats.byMedio[medio] || 0) + 1;
          
          // Count enviado status
          if (currentUser.enviado) {
            userStats.enviado++;
          } else {
            userStats.noEnviado++;
          }
        }
      } catch (dbError) {
        console.error(`Error checking user ${sentUser.whatsapp} in database ${sentUser.database}:`, dbError);
      }
    }
    
    res.json({
      campaign,
      userStats
    });
    
  } catch (error) {
    console.error('Error fetching campaign details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch campaign details',
      details: error.message 
    });
  }
});

// Create new campaign
router.post('/', async (req, res) => {
  try {
    console.log('🎯 === CREANDO NUEVA CAMPAÑA ===');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    const { name, templateName, templateLanguage, databases } = req.body;
    
    // Validar datos requeridos
    if (!name) {
      console.error('❌ Error: name is required');
      return res.status(400).json({ 
        error: 'Campaign name is required',
        details: 'El nombre de la campaña es obligatorio' 
      });
    }
    
    if (!templateName) {
      console.error('❌ Error: templateName is required');
      return res.status(400).json({ 
        error: 'Template name is required',
        details: 'El nombre de la plantilla es obligatorio' 
      });
    }
    
    if (!databases || (Array.isArray(databases) && databases.length === 0)) {
      console.error('❌ Error: databases is required');
      return res.status(400).json({ 
        error: 'At least one database is required',
        details: 'Al menos una base de datos es requerida' 
      });
    }
    
    const campaignData = {
      name,
      templateName,
      templateLanguage: templateLanguage || 'es',
      databases: Array.isArray(databases) ? databases : [databases]
    };
    
    console.log('📋 Campaign data to save:', JSON.stringify(campaignData, null, 2));
    
    const campaign = new Campaign(campaignData);
    
    console.log('💾 Guardando campaña en MongoDB...');
    await campaign.save();
    console.log('✅ Campaña guardada exitosamente:', campaign._id);
    
    res.json({ 
      success: true, 
      campaignId: campaign._id,
      campaign 
    });
  } catch (error) {
    console.error('❌ === ERROR CREANDO CAMPAÑA ===');
    console.error('📄 Error name:', error.name);
    console.error('📄 Error message:', error.message);
    console.error('📄 Error stack:', error.stack);
    
    // Manejo específico de errores de MongoDB
    if (error.name === 'ValidationError') {
      console.error('🚨 MongoDB Validation Error:', error.errors);
      return res.status(400).json({ 
        error: 'Campaign validation failed',
        details: error.message,
        validationErrors: error.errors
      });
    }
    
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      console.error('🚨 MongoDB Connection/Server Error:', error);
      return res.status(503).json({ 
        error: 'Database connection error',
        details: 'Error de conexión con la base de datos'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create campaign',
      details: error.message,
      errorType: error.name
    });
  }
});

// Add sent user to campaign
router.post('/:campaignId/add-user', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { whatsapp, database, status, messageId, error } = req.body;
    
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Add user to sent list
    campaign.sentUsers.push({
      whatsapp,
      database,
      sentAt: new Date(),
      status: status || 'sent',
      messageId,
      error
    });
    
    // Update counters
    if (status === 'sent' || !status) {
      campaign.totalSuccess++;
    } else if (status === 'failed') {
      campaign.totalFailed++;
    }
    
    campaign.totalSent = campaign.sentUsers.length;
    
    await campaign.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding user to campaign:', error);
    res.status(500).json({ 
      error: 'Failed to add user to campaign',
      details: error.message 
    });
  }
});

// Complete campaign
router.post('/:campaignId/complete', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    campaign.completedAt = new Date();
    await campaign.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error completing campaign:', error);
    res.status(500).json({ 
      error: 'Failed to complete campaign',
      details: error.message 
    });
  }
});

export default router;