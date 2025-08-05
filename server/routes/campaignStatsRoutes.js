import express from 'express';
import CampaignStats from '../models/campaignStatsModel.js';
import { getDatabase, getDatabaseModel } from '../config/databases.js';

const router = express.Router();

// Crear nueva campaña de estadísticas
router.post('/create', async (req, res) => {
  try {
    const { 
      templateName, 
      usersList, 
      databases, 
      sendingOrder = 'desc',
      notes = ''
    } = req.body;

    if (!templateName || !usersList || !Array.isArray(usersList)) {
      return res.status(400).json({ 
        error: 'Template name and users list are required' 
      });
    }

    // Generar ID único para la campaña
    const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Crear snapshot de usuarios con su estado actual
    const usersSnapshot = [];
    
    for (const user of usersList) {
      try {
        // Buscar el usuario en las bases de datos para obtener su estado actual
        let userData = null;
        
        for (const dbKey of databases) {
          const dbConfig = getDatabase(dbKey);
          if (!dbConfig) continue;
          
          const UserModel = await getDatabaseModel(dbConfig);
          userData = await UserModel.findOne({ whatsapp: user.whatsapp })
            .select('whatsapp estado medio pagado_at upsell_pagado_at ingreso enviado')
            .lean();
          
          if (userData) {
            userData._sourceDatabase = dbKey;
            break;
          }
        }

        if (userData) {
          usersSnapshot.push({
            whatsapp: userData.whatsapp,
            estadoInicial: userData.estado || 'desconocido',
            medioInicial: userData.medio || '',
            pagadoAtInicial: userData.pagado_at || null,
            upsellAtInicial: userData.upsell_pagado_at || null,
            ingresoInicial: userData.ingreso || null,
            enviado: true,
            sourceDatabase: userData._sourceDatabase
          });
        }
      } catch (userError) {
        console.error(`Error processing user ${user.whatsapp}:`, userError);
        // Agregar usuario con datos mínimos si hay error
        usersSnapshot.push({
          whatsapp: user.whatsapp,
          estadoInicial: 'error',
          medioInicial: '',
          pagadoAtInicial: null,
          upsellAtInicial: null,
          ingresoInicial: null,
          enviado: true,
          sourceDatabase: 'unknown'
        });
      }
    }

    // Crear el registro de campaña
    const campaignStats = new CampaignStats({
      campaignId,
      templateName,
      totalSent: usersSnapshot.length,
      usersSnapshot,
      databases,
      sendingOrder,
      notes
    });

    await campaignStats.save();

    res.json({
      success: true,
      campaignId,
      message: `Campaign tracked with ${usersSnapshot.length} users`,
      campaign: campaignStats
    });

  } catch (error) {
    console.error('Error creating campaign stats:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Obtener todas las campañas
router.get('/campaigns', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const campaigns = await CampaignStats.find()
      .select('campaignId templateName sentAt totalSent databases notes')
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CampaignStats.countDocuments();

    res.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Obtener estadísticas de una campaña específica
router.get('/campaign/:campaignId/stats', async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Obtener la campaña
    const campaign = await CampaignStats.findOne({ campaignId });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Obtener estados actuales de los usuarios
    const currentStates = [];
    
    for (const userSnapshot of campaign.usersSnapshot) {
      try {
        let currentUserData = null;
        
        // Buscar el usuario en las bases de datos para obtener su estado actual
        for (const dbKey of campaign.databases) {
          const dbConfig = getDatabase(dbKey);
          if (!dbConfig) continue;
          
          const UserModel = await getDatabaseModel(dbConfig);
          currentUserData = await UserModel.findOne({ whatsapp: userSnapshot.whatsapp })
            .select('whatsapp estado medio pagado_at upsell_pagado_at ingreso respondio_masivo')
            .lean();
          
          if (currentUserData) {
            currentUserData._sourceDatabase = dbKey;
            break;
          }
        }

        if (currentUserData) {
          currentStates.push({
            whatsapp: currentUserData.whatsapp,
            estadoInicial: userSnapshot.estadoInicial,
            estadoActual: currentUserData.estado || 'desconocido',
            medioInicial: userSnapshot.medioInicial,
            medioActual: currentUserData.medio || '',
            pagadoAtInicial: userSnapshot.pagadoAtInicial,
            pagadoAtActual: currentUserData.pagado_at,
            upsellAtInicial: userSnapshot.upsellAtInicial,
            upsellAtActual: currentUserData.upsell_pagado_at,
            respondioMasivo: currentUserData.respondio_masivo || false,
            sourceDatabase: currentUserData._sourceDatabase
          });
        } else {
          // Usuario no encontrado - puede haber sido eliminado
          currentStates.push({
            whatsapp: userSnapshot.whatsapp,
            estadoInicial: userSnapshot.estadoInicial,
            estadoActual: 'no_encontrado',
            medioInicial: userSnapshot.medioInicial,
            medioActual: '',
            pagadoAtInicial: userSnapshot.pagadoAtInicial,
            pagadoAtActual: null,
            upsellAtInicial: userSnapshot.upsellAtInicial,
            upsellAtActual: null,
            respondioMasivo: false,
            sourceDatabase: userSnapshot.sourceDatabase
          });
        }
      } catch (userError) {
        console.error(`Error processing user ${userSnapshot.whatsapp}:`, userError);
      }
    }

    // Calcular estadísticas
    const stats = {
      totalEnviados: campaign.totalSent,
      respondieron: currentStates.filter(u => u.respondioMasivo || u.estadoActual === 'respondido').length,
      nuevasPagados: currentStates.filter(u => 
        u.estadoInicial !== 'pagado' && u.estadoActual === 'pagado'
      ).length,
      nuevosUpsells: currentStates.filter(u => 
        !u.upsellAtInicial && u.upsellAtActual && 
        u.upsellAtActual > (campaign.sentAt.getTime() / 1000)
      ).length,
      cambiosEstado: currentStates.filter(u => 
        u.estadoInicial !== u.estadoActual
      ).length
    };

    // Agrupar por estado inicial vs actual
    const estadosComparison = {};
    currentStates.forEach(user => {
      const key = `${user.estadoInicial} → ${user.estadoActual}`;
      estadosComparison[key] = (estadosComparison[key] || 0) + 1;
    });

    res.json({
      campaign: {
        campaignId: campaign.campaignId,
        templateName: campaign.templateName,
        sentAt: campaign.sentAt,
        databases: campaign.databases,
        notes: campaign.notes
      },
      stats,
      estadosComparison,
      userDetails: currentStates,
      summary: {
        tasaRespuesta: ((stats.respondieron / stats.totalEnviados) * 100).toFixed(2) + '%',
        tasaConversion: ((stats.nuevasPagados / stats.totalEnviados) * 100).toFixed(2) + '%',
        tasaUpsell: ((stats.nuevosUpsells / stats.totalEnviados) * 100).toFixed(2) + '%'
      }
    });

  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Eliminar campaña
router.delete('/campaign/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const result = await CampaignStats.deleteOne({ campaignId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ 
      success: true, 
      message: 'Campaign deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

export default router;