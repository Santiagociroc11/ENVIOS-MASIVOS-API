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
    
    // Find the campaign in CampaignStats (same source as StatsPanel)
    const campaignStats = await CampaignStats.findOne({ campaignId });
    if (!campaignStats) {
      return res.status(404).json({ 
        error: 'Campaign not found',
        details: 'La campaña especificada no existe en las estadísticas' 
      });
    }
    
    console.log('✅ Campaña encontrada:', campaignStats.campaignId);
    console.log('📊 Usuarios en snapshot:', campaignStats.usersSnapshot.length);
    console.log('🎯 Plantilla:', campaignStats.templateName);
    console.log('📅 Fecha envío:', campaignStats.sentAt);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let flagMasivoUpdated = 0;
    let flagMasivoAlreadySet = 0;
    let flagMasivoNotNeeded = 0;
    let respondioMasivoUpdated = 0;
    let respondioMasivoAtUpdated = 0;
    const results = [];
    
    // Process each user from snapshot
    for (const userSnapshot of campaignStats.usersSnapshot) {
      try {
        // Find user in databases
        let currentUser = null;
        let userDatabase = null;
        
        for (const dbKey of campaignStats.databases) {
          const dbConfig = getDatabase(dbKey);
          if (!dbConfig) continue;
          
          const UserModel = await getDatabaseModel(dbConfig);
          currentUser = await UserModel.findOne({ whatsapp: userSnapshot.whatsapp })
            .select('whatsapp estado medio pagado_at upsell_pagado_at plantilla_at plantilla_enviada flag_masivo respondio_masivo respondio_masivo_at');
          
          if (currentUser) {
            userDatabase = { key: dbKey, config: dbConfig };
            break;
          }
        }
        
        if (!currentUser) {
          skippedCount++;
          results.push({
            whatsapp: userSnapshot.whatsapp,
            database: userSnapshot.sourceDatabase,
            success: false,
            reason: 'Usuario no encontrado en la base de datos'
          });
          console.warn(`⚠️ Usuario ${userSnapshot.whatsapp} no encontrado en ninguna base de datos`);
          continue;
        }
        
        // Calculate plantilla_at from campaign sentAt (convert to unix timestamp)
        const plantillaAt = Math.floor(new Date(campaignStats.sentAt).getTime() / 1000);
        
        // Base update data
        const updateData = {
          plantilla_at: plantillaAt,
          plantilla_enviada: campaignStats.templateName
        };
        
        // Determine if we should set flag_masivo = true
        let shouldSetFlagMasivo = false;
        let flagReason = '';
        
        // Use snapshot data to detect state changes (we have direct access)
        const initialState = userSnapshot.estadoInicial || 'desconocido';
        const currentState = currentUser.estado || 'desconocido';
        
        console.log(`🔍 Usuario ${userSnapshot.whatsapp}:`);
        console.log(`   Estado inicial (snapshot): "${initialState}"`);
        console.log(`   Estado actual (BD): "${currentState}"`);
        console.log(`   ¿Cambió?: ${initialState !== currentState}`);
        console.log(`   flag_masivo actual: ${currentUser.flag_masivo}`);
        
        if (initialState !== currentState) {
          shouldSetFlagMasivo = true;
          flagReason = `Estado cambió: ${initialState} → ${currentState}`;
          console.log(`   ✅ DEBERÍA TENER flag_masivo: ${flagReason}`);
          
          // Si cambió de estado, también necesita campos de respuesta masiva
          if (!currentUser.respondio_masivo) {
            updateData.respondio_masivo = true;
            console.log(`   📱 Agregando respondio_masivo = true`);
          }
          
          if (!currentUser.respondio_masivo_at) {
            // 10 segundos después del envío de la plantilla
            const respondioMasivoAt = plantillaAt + 10;
            updateData.respondio_masivo_at = respondioMasivoAt;
            console.log(`   ⏰ Agregando respondio_masivo_at = ${respondioMasivoAt} (${new Date(respondioMasivoAt * 1000).toISOString()})`);
          }
        } else {
          console.log(`   ❌ No cambió de estado`);
        }
        
        // Add flag_masivo to update if needed
        if (shouldSetFlagMasivo) {
          if (!currentUser.flag_masivo) {
            updateData.flag_masivo = true;
            flagMasivoUpdated++;
          } else {
            // Ya tenía flag_masivo, pero reportamos que era candidato
            flagMasivoAlreadySet++;
            console.log(`ℹ️ Usuario ${userSnapshot.whatsapp} ya tenía flag_masivo = true`);
          }
        } else {
          flagMasivoNotNeeded++;
          console.log(`❌ Usuario ${userSnapshot.whatsapp} NO necesita flag_masivo`);
          console.log(`   Razón: ${flagReason || 'No hay cambios detectados'}`);
          console.log(`   Estado actual: ${currentUser.estado}`);
          console.log(`   flag_masivo actual: ${currentUser.flag_masivo}`);
        }
        
        console.log(`📝 Actualizando usuario ${userSnapshot.whatsapp} en ${userDatabase.key}:`, updateData);
        if (shouldSetFlagMasivo) {
          console.log(`🏷️ Flag masivo agregado: ${flagReason}`);
        }
        
        const UserModel = await getDatabaseModel(userDatabase.config);
        const result = await UserModel.updateOne(
          { whatsapp: userSnapshot.whatsapp },
          { $set: updateData }
        );
        
        if (result.matchedCount > 0) {
          updatedCount++;
          results.push({
            whatsapp: userSnapshot.whatsapp,
            database: userDatabase.key,
            success: true,
            plantilla_at: plantillaAt,
            plantilla_enviada: campaignStats.templateName,
            flag_masivo_updated: shouldSetFlagMasivo && !currentUser.flag_masivo,
            flag_reason: flagReason || 'No necesita flag masivo'
          });
          console.log(`✅ Usuario ${userSnapshot.whatsapp} actualizado correctamente`);
        } else {
          skippedCount++;
          results.push({
            whatsapp: userSnapshot.whatsapp,
            database: userDatabase.key,
            success: false,
            reason: 'No se pudo actualizar en la base de datos'
          });
          console.warn(`⚠️ Usuario ${userSnapshot.whatsapp} no se pudo actualizar en ${userDatabase.key}`);
        }
        
      } catch (userError) {
        errorCount++;
        results.push({
          whatsapp: userSnapshot.whatsapp,
          database: userSnapshot.sourceDatabase,
          success: false,
          error: userError.message
        });
        console.error(`❌ Error procesando usuario ${userSnapshot.whatsapp}:`, userError);
      }
    }
    
    console.log('📊 === RESUMEN DETALLADO DE ACTUALIZACIÓN ===');
    console.log('✅ Actualizados:', updatedCount);
    console.log('🏷️ Flags masivos agregados:', flagMasivoUpdated);
    console.log('🏷️ Flags masivos ya existentes:', flagMasivoAlreadySet);
    console.log('🚫 Flags masivos no necesarios:', flagMasivoNotNeeded);
    console.log('📱 respondio_masivo agregados:', respondioMasivoUpdated);
    console.log('⏰ respondio_masivo_at agregados:', respondioMasivoAtUpdated);
    console.log('⚠️ Omitidos:', skippedCount);
    console.log('❌ Errores:', errorCount);
    console.log('📋 Total procesados:', campaignStats.usersSnapshot.length);
    console.log('🧮 Verificación:', updatedCount + skippedCount + errorCount, '=', campaignStats.usersSnapshot.length);
    console.log('🏷️ Total candidatos flag_masivo:', flagMasivoUpdated + flagMasivoAlreadySet);
    console.log('================================================');
    
    res.json({
      success: true,
      campaign: {
        campaignId: campaignStats.campaignId,
        templateName: campaignStats.templateName
      },
      summary: {
        total: campaignStats.usersSnapshot.length,
        updated: updatedCount,
        flagMasivoUpdated: flagMasivoUpdated,
        flagMasivoAlreadySet: flagMasivoAlreadySet,
        flagMasivoNotNeeded: flagMasivoNotNeeded,
        respondioMasivoUpdated: respondioMasivoUpdated,
        respondioMasivoAtUpdated: respondioMasivoAtUpdated,
        totalFlagMasivoCandidates: flagMasivoUpdated + flagMasivoAlreadySet,
        skipped: skippedCount,
        errors: errorCount
      },
      hasSnapshots: true, // Always true now since we use CampaignStats directly
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

// Cleanup campaign - Remove users without flag_masivo and clean their BD records
router.post('/:campaignId/cleanup', async (req, res) => {
  try {
    const { campaignId } = req.params;
    console.log(`🧹 Starting cleanup for campaign: ${campaignId}`);

    // Find the campaign in CampaignStats
    const campaignStats = await CampaignStats.findOne({ campaignId });
    if (!campaignStats) {
      return res.status(404).json({ error: 'Campaign not found in statistics' });
    }

    console.log(`📊 Found campaign with ${campaignStats.usersSnapshot.length} users in snapshot`);

    // Identify users WITHOUT flag_masivo (users who didn't respond)
    const usersWithoutFlagMasivo = campaignStats.usersSnapshot.filter(user => !user.flag_masivo);
    const usersWithFlagMasivo = campaignStats.usersSnapshot.filter(user => user.flag_masivo);

    console.log(`🔍 Analysis:
    - Users with flag_masivo (responded): ${usersWithFlagMasivo.length}
    - Users without flag_masivo (to be cleaned): ${usersWithoutFlagMasivo.length}`);

    if (usersWithoutFlagMasivo.length === 0) {
      return res.json({
        message: 'No users to cleanup - all users have flag_masivo (responded)',
        usersKept: usersWithFlagMasivo.length,
        usersRemoved: 0,
        databaseUpdates: {}
      });
    }

    // Group users by database for efficient batch updates
    const usersByDatabase = new Map();
    for (const user of usersWithoutFlagMasivo) {
      for (const dbKey of campaignStats.databases) {
        if (!usersByDatabase.has(dbKey)) {
          usersByDatabase.set(dbKey, []);
        }
        usersByDatabase.get(dbKey).push(user.whatsapp);
      }
    }

    console.log(`📚 Will clean users from ${usersByDatabase.size} databases`);

    // Clean flag_masivo from users in each database
    const databaseUpdates = {};
    for (const [dbKey, whatsappNumbers] of usersByDatabase.entries()) {
      try {
        const dbConfig = getDatabase(dbKey);
        if (!dbConfig) {
          console.warn(`⚠️ Database ${dbKey} not found, skipping...`);
          continue;
        }

        const UserModel = await getDatabaseModel(dbConfig);
        
        // Remove flag_masivo, plantilla_at, plantilla_enviada, and respondio_masivo fields
        const updateResult = await UserModel.updateMany(
          { whatsapp: { $in: whatsappNumbers } },
          { 
            $unset: { 
              flag_masivo: "",
              plantilla_at: "",
              plantilla_enviada: "",
              respondio_masivo: "",
              respondio_masivo_at: ""
            }
          }
        );

        databaseUpdates[dbKey] = {
          usersProcessed: whatsappNumbers.length,
          documentsModified: updateResult.modifiedCount,
          documentsMatched: updateResult.matchedCount
        };

        console.log(`✅ Database ${dbKey}: ${updateResult.modifiedCount}/${whatsappNumbers.length} users cleaned`);

      } catch (dbError) {
        console.error(`❌ Error cleaning database ${dbKey}:`, dbError);
        databaseUpdates[dbKey] = {
          error: dbError.message,
          usersProcessed: whatsappNumbers.length,
          documentsModified: 0,
          documentsMatched: 0
        };
      }
    }

    // Update campaign stats to keep only users with flag_masivo
    const originalTotalSent = campaignStats.totalSent;
    campaignStats.usersSnapshot = usersWithFlagMasivo;
    campaignStats.totalSent = usersWithFlagMasivo.length;

    // Update notes to reflect the cleanup
    const currentNotes = campaignStats.notes || '';
    const cleanupNote = `\n🧹 LIMPIEZA: ${usersWithoutFlagMasivo.length} usuarios sin respuesta eliminados de la campaña (${originalTotalSent} → ${usersWithFlagMasivo.length})`;
    campaignStats.notes = currentNotes + cleanupNote;

    await campaignStats.save();

    console.log(`✅ Campaign cleanup completed:
    - Original users: ${originalTotalSent}
    - Users kept (responded): ${usersWithFlagMasivo.length}
    - Users removed (no response): ${usersWithoutFlagMasivo.length}
    - Campaign totalSent updated: ${originalTotalSent} → ${usersWithFlagMasivo.length}`);

    res.json({
      message: 'Campaign cleanup completed successfully',
      campaignId: campaignId,
      originalTotalSent: originalTotalSent,
      usersKept: usersWithFlagMasivo.length,
      usersRemoved: usersWithoutFlagMasivo.length,
      newTotalSent: usersWithFlagMasivo.length,
      databaseUpdates: databaseUpdates,
      summary: {
        respondedUsers: usersWithFlagMasivo.length,
        cleanedUsers: usersWithoutFlagMasivo.length,
        percentageKept: originalTotalSent > 0 ? ((usersWithFlagMasivo.length / originalTotalSent) * 100).toFixed(1) : 0
      }
    });

  } catch (error) {
    console.error('❌ Error during campaign cleanup:', error);
    res.status(500).json({ 
      error: 'Failed to cleanup campaign',
      details: error.message 
    });
  }
});

export default router;