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
    const { name, templateName, templateLanguage, databases } = req.body;
    
    const campaign = new Campaign({
      name,
      templateName,
      templateLanguage: templateLanguage || 'es',
      databases: Array.isArray(databases) ? databases : [databases]
    });
    
    await campaign.save();
    
    res.json({ 
      success: true, 
      campaignId: campaign._id,
      campaign 
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ 
      error: 'Failed to create campaign',
      details: error.message 
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