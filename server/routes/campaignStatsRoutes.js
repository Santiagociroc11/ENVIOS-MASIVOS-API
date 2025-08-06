import express from 'express';
import CampaignStats from '../models/campaignStatsModel.js';
import { getDatabase } from '../config/databases.js';
import { getDatabaseModel } from '../models/dynamicUserModel.js';

const router = express.Router();

// Ruta de prueba para debugging
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Test route called');
    
    // Probar conexión a la base de datos
    const count = await CampaignStats.countDocuments();
    console.log(`📊 Total campaigns in DB: ${count}`);
    
    // Crear una campaña de prueba si no existe ninguna
    if (count === 0) {
      console.log('🔨 Creating test campaign...');
      const testCampaign = new CampaignStats({
        campaignId: 'test_campaign_123',
        templateName: 'Test Template',
        totalSent: 5,
        usersSnapshot: [
          {
            whatsapp: '573001234567',
            estadoInicial: 'bienvenida',
            medioInicial: 'whatsapp',
            enviado: true,
            sourceDatabase: 'bot-win-4'
          }
        ],
        databases: ['bot-win-4'],
        sendingOrder: 'desc',
        notes: 'Campaña de prueba'
      });
      
      await testCampaign.save();
      console.log('✅ Test campaign created');
    }
    
    // Obtener todas las campañas
    const campaigns = await CampaignStats.find().limit(5);
    
    res.json({
      success: true,
      message: 'Test successful',
      totalCampaigns: count,
      sampleCampaigns: campaigns
    });
    
  } catch (error) {
    console.error('❌ Test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Crear nueva campaña de estadísticas
router.post('/create', async (req, res) => {
  try {
    console.log('📊 POST /create - Creating campaign stats...');
    console.log('📦 Request body:', req.body);
    
    const { 
      templateName, 
      usersList, 
      databases, 
      sendingOrder = 'desc',
      notes = ''
    } = req.body;
    
    console.log('📊 Parsed data:', { templateName, usersList: usersList?.length, databases, sendingOrder, notes });

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
            .select('whatsapp estado medio pagado_at upsell_pagado_at ingreso enviado plantilla_at flag_masivo')
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
            plantillaAtInicial: userData.plantilla_at || null,
            flagMasivoInicial: userData.flag_masivo || false,
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
          plantillaAtInicial: null,
          flagMasivoInicial: false,
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
    console.log('🔍 GET /campaigns - Fetching campaigns...');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    console.log(`📄 Page: ${page}, Limit: ${limit}, Skip: ${skip}`);

    const campaigns = await CampaignStats.find()
      .select('campaignId templateName sentAt totalSent databases notes')
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CampaignStats.countDocuments();

    console.log(`📊 Found ${campaigns.length} campaigns, Total: ${total}`);

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
    console.error('❌ Error fetching campaigns:', error);
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
            .select('whatsapp estado medio pagado_at upsell_pagado_at ingreso respondio_masivo plantilla_at flag_masivo')
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
            plantillaAtInicial: userSnapshot.plantillaAtInicial,
            plantillaAtActual: currentUserData.plantilla_at,
            flagMasivoInicial: userSnapshot.flagMasivoInicial,
            flagMasivoActual: currentUserData.flag_masivo || false,
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
            plantillaAtInicial: userSnapshot.plantillaAtInicial,
            plantillaAtActual: null,
            flagMasivoInicial: userSnapshot.flagMasivoInicial,
            flagMasivoActual: false,
            respondioMasivo: false,
            sourceDatabase: userSnapshot.sourceDatabase
          });
        }
      } catch (userError) {
        console.error(`Error processing user ${userSnapshot.whatsapp}:`, userError);
      }
    }

    // Calcular estadísticas más precisas
    const campaignDate = campaign.sentAt;
    
    const stats = {
      totalEnviados: campaign.totalSent,
      // Solo contar respuestas después del envío de la campaña (con flag_masivo: true)
      respondieron: currentStates.filter(u => {
        // Verificar si hay cambio de estado que indique interacción después del envío
        const hasStateChange = u.estadoInicial !== u.estadoActual;
        const hasResponseState = u.estadoActual === 'respondido' || u.estadoActual === 'respondido-masivo' || u.respondioMasivo;
        const hasFlagMasivo = u.flagMasivoActual === true;
        return hasStateChange && hasResponseState && hasFlagMasivo;
      }).length,
      // Solo nuevos pagos que son producto de la plantilla (con flag_masivo: true)
      nuevasPagados: currentStates.filter(u => {
        const wasNotPaid = u.estadoInicial !== 'pagado' && !u.pagadoAtInicial;
        const isNowPaid = u.estadoActual === 'pagado' || u.pagadoAtActual;
        
        // Verificar si la compra fue producto de la plantilla:
        // plantilla_at debe existir y ser menor que pagado_at (timestamps unix)
        const hasPlantillaTimestamp = u.plantillaAtActual || u.plantillaAtInicial;
        const hasPagadoTimestamp = u.pagadoAtActual;
        const plantillaBeforePago = hasPlantillaTimestamp && hasPagadoTimestamp && 
          (u.plantillaAtActual || u.plantillaAtInicial) < u.pagadoAtActual;
        
        // Verificar flag_masivo
        const hasFlagMasivo = u.flagMasivoActual === true;
        
        return wasNotPaid && isNowPaid && plantillaBeforePago && hasFlagMasivo;
      }).length,
      // Solo upsells después del envío de campaña (con flag_masivo: true)
      nuevosUpsells: currentStates.filter(u => {
        const hadNoUpsell = !u.upsellAtInicial;
        const hasUpsellNow = u.upsellAtActual;
        const upsellAfterCampaign = u.upsellAtActual && 
          new Date(u.upsellAtActual).getTime() > campaignDate.getTime();
        const hasFlagMasivo = u.flagMasivoActual === true;
        return hadNoUpsell && hasUpsellNow && upsellAfterCampaign && hasFlagMasivo;
      }).length,
      // Solo cambios de estado relevantes
      cambiosEstado: currentStates.filter(u => 
        u.estadoInicial !== u.estadoActual
      ).length,
      // Estadísticas específicas de efectividad de plantilla
      usuariosConPlantilla: currentStates.filter(u => 
        u.plantillaAtActual || u.plantillaAtInicial
      ).length,
      usuariosConCompras: currentStates.filter(u => 
        u.pagadoAtActual && u.flagMasivoActual === true
      ).length,
      comprasDirectasPlantilla: currentStates.filter(u => {
        const hasPlantillaTimestamp = u.plantillaAtActual || u.plantillaAtInicial;
        const hasPagadoTimestamp = u.pagadoAtActual;
        const plantillaBeforePago = hasPlantillaTimestamp && hasPagadoTimestamp && 
          (u.plantillaAtActual || u.plantillaAtInicial) < u.pagadoAtActual;
        const hasFlagMasivo = u.flagMasivoActual === true;
        return plantillaBeforePago && hasFlagMasivo;
      }).length
    };

    // Agrupar por estado inicial vs actual (solo cambios significativos)
    const estadosComparison = {};
    currentStates.forEach(user => {
      // Solo mostrar transiciones que representan cambios reales
      if (user.estadoInicial !== user.estadoActual) {
        const key = `${user.estadoInicial} → ${user.estadoActual}`;
        estadosComparison[key] = (estadosComparison[key] || 0) + 1;
      }
    });

    // Agregar información de debugging para análisis
    const debugInfo = {
      totalUsers: currentStates.length,
      usersFound: currentStates.filter(u => u.estadoActual !== 'no_encontrado').length,
      usersNotFound: currentStates.filter(u => u.estadoActual === 'no_encontrado').length,
      stateChanges: currentStates.filter(u => u.estadoInicial !== u.estadoActual).length,
      noStateChanges: currentStates.filter(u => u.estadoInicial === u.estadoActual).length,
      usuariosConFlagMasivo: currentStates.filter(u => u.flagMasivoActual === true).length,
      usuariosSinFlagMasivo: currentStates.filter(u => u.flagMasivoActual !== true).length
    };

    console.log('📊 Campaign Stats Debug:', debugInfo);

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
        tasaUpsell: ((stats.nuevosUpsells / stats.totalEnviados) * 100).toFixed(2) + '%',
        efectividadPlantilla: stats.usuariosConPlantilla > 0 
          ? ((stats.comprasDirectasPlantilla / stats.usuariosConPlantilla) * 100).toFixed(2) + '%'
          : '0%',
        comprasDirectasDelaPlantilla: stats.comprasDirectasPlantilla + ' de ' + stats.usuariosConCompras + ' compras totales',
        usuariosConFlagMasivo: debugInfo.usuariosConFlagMasivo + ' de ' + debugInfo.totalUsers + ' usuarios'
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