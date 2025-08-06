import express from 'express';
import Campaign from '../models/campaignModel.js';
import CampaignStats from '../models/campaignStatsModel.js';
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
    console.log('🎯 === BACKEND: AGREGANDO USUARIO A CAMPAÑA ===');
    
    const { campaignId } = req.params;
    const { whatsapp, database, status, messageId, error } = req.body;
    
    console.log('🆔 Campaign ID from params:', campaignId);
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    console.log('🔍 Buscando campaña en MongoDB...');
    const campaign = await Campaign.findById(campaignId);
    
    if (!campaign) {
      console.error('❌ Campaign not found:', campaignId);
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    console.log('✅ Campaign found:', campaign.name);
    console.log('📊 Current campaign stats:');
    console.log('  - totalSent:', campaign.totalSent);
    console.log('  - totalSuccess:', campaign.totalSuccess);
    console.log('  - totalFailed:', campaign.totalFailed);
    console.log('  - sentUsers length:', campaign.sentUsers.length);
    
    // Check if user already exists in campaign to prevent duplicates
    const existingUser = campaign.sentUsers.find(user => user.whatsapp === whatsapp);
    
    if (existingUser) {
      console.log('⚠️ User already exists in campaign, updating status instead of duplicating:', whatsapp);
      existingUser.status = status || 'sent';
      existingUser.sentAt = new Date();
      if (messageId) existingUser.messageId = messageId;
      if (error) existingUser.error = error;
    } else {
      // Add user to sent list
      const newUser = {
        whatsapp,
        database,
        sentAt: new Date(),
        status: status || 'sent',
        messageId,
        error
      };
      
      console.log('👤 Adding user to campaign:', newUser);
      campaign.sentUsers.push(newUser);
    }
    
    // Update counters (only increment for new users, not updates)
    console.log('📊 Updating counters...');
    if (!existingUser) {
      if (status === 'sent' || !status) {
        campaign.totalSuccess++;
        console.log('✅ Incrementing totalSuccess to:', campaign.totalSuccess);
      } else if (status === 'failed') {
        campaign.totalFailed++;
        console.log('❌ Incrementing totalFailed to:', campaign.totalFailed);
      }
      
      campaign.totalSent = campaign.sentUsers.length;
      console.log('📊 Updated totalSent to:', campaign.totalSent);
    } else {
      console.log('📊 No counter update - user was already in campaign');
    }
    
    console.log('💾 Saving campaign to MongoDB...');
    await campaign.save();
    console.log('✅ Campaign saved successfully');
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ === ERROR ADDING USER TO CAMPAIGN ===');
    console.error('📄 Error name:', error.name);
    console.error('📄 Error message:', error.message);
    console.error('📄 Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Failed to add user to campaign',
      details: error.message,
      errorType: error.name
    });
  }
});

// Complete campaign
router.post('/:campaignId/complete', async (req, res) => {
  try {
    console.log('🏁 === BACKEND: COMPLETANDO CAMPAÑA ===');
    
    const { campaignId } = req.params;
    console.log('🆔 Campaign ID from params:', campaignId);
    
    console.log('🔍 Buscando campaña en MongoDB...');
    const campaign = await Campaign.findById(campaignId);
    
    if (!campaign) {
      console.error('❌ Campaign not found:', campaignId);
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    console.log('✅ Campaign found:', campaign.name);
    console.log('📊 Final campaign stats:');
    console.log('  - totalSent:', campaign.totalSent);
    console.log('  - totalSuccess:', campaign.totalSuccess);
    console.log('  - totalFailed:', campaign.totalFailed);
    console.log('  - sentUsers length:', campaign.sentUsers.length);
    console.log('  - completedAt (before):', campaign.completedAt);
    
    campaign.completedAt = new Date();
    console.log('⏰ Setting completedAt to:', campaign.completedAt);
    
    console.log('💾 Saving completed campaign to MongoDB...');
    await campaign.save();
    console.log('✅ Campaign completed and saved successfully');
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ === ERROR COMPLETING CAMPAIGN ===');
    console.error('📄 Error name:', error.name);
    console.error('📄 Error message:', error.message);
    console.error('📄 Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Failed to complete campaign',
      details: error.message,
      errorType: error.name
    });
  }
});

// Update campaign users retroactively with plantilla_at, plantilla_enviada, and flag_masivo
router.post('/:campaignId/fix-plantilla-fields', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    console.log('🔧 === ACTUALIZANDO CAMPOS PLANTILLA + FLAG_MASIVO RETROACTIVAMENTE ===');
    console.log('🆔 Campaign ID:', campaignId);
    
    // Find the campaign in the regular Campaign collection
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ 
        error: 'Campaign not found',
        details: 'La campaña especificada no existe' 
      });
    }
    
    console.log('📋 Campaña encontrada:', campaign.name);
    console.log('📊 Usuarios enviados:', campaign.sentUsers.length);
    console.log('🎯 Plantilla:', campaign.templateName);
    
    // Try to find the corresponding CampaignStats for initial state snapshots
    let campaignStats = null;
    try {
      console.log('🔍 === BUSCANDO CAMPAIGNSTATS ===');
      console.log('🆔 Campaign ID:', campaignId);
      console.log('📋 Template:', campaign.templateName);
      
      // First try: Search by exact campaignId (same as stats panel)
      campaignStats = await CampaignStats.findOne({ campaignId: campaignId });
      
      if (campaignStats) {
        console.log('✅ CampaignStats encontrado por campaignId exacto');
      } else {
        console.log('⚠️ No encontrado por campaignId, intentando otras estrategias...');
        
        // Second try: Search by templateName and approximate date
        const campaignDate = campaign.createdAt;
        const startDate = new Date(campaignDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days before
        const endDate = new Date(campaignDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days after
        
        campaignStats = await CampaignStats.findOne({
          templateName: campaign.templateName,
          sentAt: { $gte: startDate, $lte: endDate }
        });
        
        if (campaignStats) {
          console.log('✅ CampaignStats encontrado por template + fecha');
        } else {
          // Third try: Search by template name and match users
          const allCampaignStats = await CampaignStats.find({
            templateName: campaign.templateName
          }).sort({ sentAt: -1 });
          
          console.log(`📊 Found ${allCampaignStats.length} CampaignStats with template "${campaign.templateName}"`);
          
          // Find the one that has the most matching users
          let bestMatch = null;
          let bestMatchScore = 0;
          
          for (const candidateStats of allCampaignStats) {
            const campaignUsers = new Set(campaign.sentUsers.map(u => u.whatsapp));
            const statsUsers = new Set(candidateStats.usersSnapshot.map(u => u.whatsapp));
            
            // Calculate intersection
            const intersection = new Set([...campaignUsers].filter(x => statsUsers.has(x)));
            const matchScore = intersection.size;
            
            console.log(`📊 CampaignStats ${candidateStats.campaignId}: ${matchScore}/${campaignUsers.size} usuarios coinciden`);
            
            if (matchScore > bestMatchScore && matchScore > 0) {
              bestMatch = candidateStats;
              bestMatchScore = matchScore;
            }
          }
          
          if (bestMatch) {
            campaignStats = bestMatch;
            console.log(`✅ Mejor coincidencia encontrada: ${bestMatchScore}/${campaign.sentUsers.length} usuarios coinciden`);
          }
        }
      }
      
      if (campaignStats) {
        console.log('📊 CampaignStats ID:', campaignStats.campaignId);
        console.log('📊 Snapshots disponibles:', campaignStats.usersSnapshot.length);
        console.log('📅 Fecha envío:', campaignStats.sentAt);
      } else {
        console.log('❌ No se encontró ningún CampaignStats - usando lógica sin snapshots');
      }
    } catch (statsError) {
      console.warn('⚠️ Error buscando CampaignStats:', statsError.message);
    }
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let flagMasivoUpdated = 0;
    let flagMasivoAlreadySet = 0;
    let flagMasivoNotNeeded = 0;
    const results = [];
    
    // Process each sent user
    for (const sentUser of campaign.sentUsers) {
      try {
        const dbConfig = getDatabase(sentUser.database);
        if (!dbConfig) {
          console.warn(`⚠️ Database ${sentUser.database} not found for user ${sentUser.whatsapp}`);
          skippedCount++;
          continue;
        }
        
        const UserModel = await getDatabaseModel(dbConfig);
        
        // Get current user data
        const currentUser = await UserModel.findOne({ whatsapp: sentUser.whatsapp })
          .select('whatsapp estado medio pagado_at upsell_pagado_at plantilla_at plantilla_enviada flag_masivo respondio_masivo');
        
        if (!currentUser) {
          skippedCount++;
          results.push({
            whatsapp: sentUser.whatsapp,
            database: sentUser.database,
            success: false,
            reason: 'Usuario no encontrado en la base de datos'
          });
          console.warn(`⚠️ Usuario ${sentUser.whatsapp} no encontrado en ${sentUser.database}`);
          continue;
        }
        
        // Calculate plantilla_at from sentAt (convert to unix timestamp)
        const plantillaAt = sentUser.sentAt ? Math.floor(new Date(sentUser.sentAt).getTime() / 1000) : Math.floor(Date.now() / 1000);
        
        // Base update data
        const updateData = {
          plantilla_at: plantillaAt,
          plantilla_enviada: campaign.templateName
        };
        
        // Determine if we should set flag_masivo = true
        let shouldSetFlagMasivo = false;
        let flagReason = '';
        
        if (campaignStats) {
          // Use snapshot data to detect state changes
          const userSnapshot = campaignStats.usersSnapshot.find(snap => snap.whatsapp === sentUser.whatsapp);
          if (userSnapshot) {
            const initialState = userSnapshot.estadoInicial || 'desconocido';
            const currentState = currentUser.estado || 'desconocido';
            
            if (initialState !== currentState) {
              shouldSetFlagMasivo = true;
              flagReason = `Estado cambió: ${initialState} → ${currentState}`;
            }
          }
        } else {
          // Alternative logic: TODOS los usuarios de campaña masiva deberían tener flag_masivo
          // Solo NO se pone si están en estados "base" que no indican interacción
          const estadosBase = ['bienvenida', 'inicial', 'nuevo', 'sin-estado', 'prospecto'];
          const currentState = currentUser.estado || 'sin-estado';
          
          // Si NO está en un estado base, o tiene signos de interacción, debe tener flag_masivo
          const hasInteractionSigns = 
            !estadosBase.includes(currentState) ||
            currentUser.respondio_masivo ||
            currentUser.pagado_at ||
            currentUser.upsell_pagado_at;
            
          if (hasInteractionSigns) {
            shouldSetFlagMasivo = true;
            flagReason = `Usuario de campaña masiva con interacción: estado=${currentState}, pagado_at=${!!currentUser.pagado_at}, respondio_masivo=${!!currentUser.respondio_masivo}`;
          } else {
            // Incluso sin signos, si es de una campaña masiva, probablemente debería tener flag
            // Solo no ponemos flag si está claramente en estado inicial
            if (!estadosBase.includes(currentState)) {
              shouldSetFlagMasivo = true;
              flagReason = `Usuario de campaña masiva en estado no-base: ${currentState}`;
            }
          }
        }
        
        // Add flag_masivo to update if needed
        if (shouldSetFlagMasivo) {
          if (!currentUser.flag_masivo) {
            updateData.flag_masivo = true;
            flagMasivoUpdated++;
          } else {
            // Ya tenía flag_masivo, pero reportamos que era candidato
            flagMasivoAlreadySet++;
            console.log(`ℹ️ Usuario ${sentUser.whatsapp} ya tenía flag_masivo = true`);
          }
        } else {
          flagMasivoNotNeeded++;
          console.log(`📝 Usuario ${sentUser.whatsapp} NO necesita flag_masivo: ${flagReason || 'estado base sin interacción'}`);
        }
        
        console.log(`📝 Actualizando usuario ${sentUser.whatsapp} en ${sentUser.database}:`, updateData);
        if (shouldSetFlagMasivo) {
          console.log(`🏷️ Flag masivo agregado: ${flagReason}`);
        }
        
        const result = await UserModel.updateOne(
          { whatsapp: sentUser.whatsapp },
          { $set: updateData }
        );
        
        if (result.matchedCount > 0) {
          updatedCount++;
          results.push({
            whatsapp: sentUser.whatsapp,
            database: sentUser.database,
            success: true,
            plantilla_at: plantillaAt,
            plantilla_enviada: campaign.templateName,
            flag_masivo_updated: shouldSetFlagMasivo && !currentUser.flag_masivo,
            flag_reason: flagReason || 'No necesita flag masivo'
          });
          console.log(`✅ Usuario ${sentUser.whatsapp} actualizado correctamente`);
        } else {
          skippedCount++;
          results.push({
            whatsapp: sentUser.whatsapp,
            database: sentUser.database,
            success: false,
            reason: 'No se pudo actualizar en la base de datos'
          });
          console.warn(`⚠️ Usuario ${sentUser.whatsapp} no se pudo actualizar en ${sentUser.database}`);
        }
        
      } catch (userError) {
        errorCount++;
        results.push({
          whatsapp: sentUser.whatsapp,
          database: sentUser.database,
          success: false,
          error: userError.message
        });
        console.error(`❌ Error procesando usuario ${sentUser.whatsapp}:`, userError);
      }
    }
    
    console.log('📊 === RESUMEN DETALLADO DE ACTUALIZACIÓN ===');
    console.log('✅ Actualizados:', updatedCount);
    console.log('🏷️ Flags masivos agregados:', flagMasivoUpdated);
    console.log('🏷️ Flags masivos ya existentes:', flagMasivoAlreadySet);
    console.log('🚫 Flags masivos no necesarios:', flagMasivoNotNeeded);
    console.log('⚠️ Omitidos:', skippedCount);
    console.log('❌ Errores:', errorCount);
    console.log('📋 Total procesados:', campaign.sentUsers.length);
    console.log('🧮 Verificación:', updatedCount + skippedCount + errorCount, '=', campaign.sentUsers.length);
    console.log('🏷️ Total candidatos flag_masivo:', flagMasivoUpdated + flagMasivoAlreadySet);
    console.log('================================================');
    
    res.json({
      success: true,
      campaign: {
        id: campaign._id,
        name: campaign.name,
        templateName: campaign.templateName
      },
      summary: {
        total: campaign.sentUsers.length,
        updated: updatedCount,
        flagMasivoUpdated: flagMasivoUpdated,
        flagMasivoAlreadySet: flagMasivoAlreadySet,
        flagMasivoNotNeeded: flagMasivoNotNeeded,
        totalFlagMasivoCandidates: flagMasivoUpdated + flagMasivoAlreadySet,
        skipped: skippedCount,
        errors: errorCount
      },
      hasSnapshots: !!campaignStats,
      results: results
    });
    
  } catch (error) {
    console.error('❌ Error updating campaign fields retroactively:', error);
    res.status(500).json({ 
      error: 'Failed to update campaign fields',
      details: error.message 
    });
  }
});

export default router;