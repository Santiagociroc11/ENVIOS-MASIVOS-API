import express from 'express';
import { getDatabase } from '../config/databases.js';
import { getDatabaseModel } from '../models/dynamicUserModel.js';

const router = express.Router();

// Get all unique estados from all selected databases
router.get('/estados', async (req, res) => {
  try {
    const databasesParam = req.query.databases || 'bot-win-2';
    const dbKeys = databasesParam.split(',').filter(key => key.trim());
    
    let allEstados = new Set();
    
    for (const dbKey of dbKeys) {
      const dbConfig = getDatabase(dbKey);
      
      if (!dbConfig) {
        console.warn(`Database ${dbKey} not found, skipping...`);
        continue;
      }
      
      try {
        const UserModel = await getDatabaseModel(dbConfig);
        
        // Get distinct estados from this database
        const estados = await UserModel.distinct('estado');
        estados.forEach(estado => {
          if (estado && estado.trim()) {
            allEstados.add(estado);
          }
        });
        
      } catch (dbError) {
        console.error(`Error fetching estados from database ${dbKey}:`, dbError);
      }
    }
    
    // Convert Set to sorted array
    const estadosArray = Array.from(allEstados).sort();
    
    res.json({
      estados: estadosArray,
      count: estadosArray.length
    });
    
  } catch (error) {
    console.error('Error fetching estados:', error);
    res.status(500).json({ 
      error: 'Failed to fetch estados',
      details: error.message 
    });
  }
});

// Get all unique payment methods from all selected databases
router.get('/medios', async (req, res) => {
  try {
    const databasesParam = req.query.databases || 'bot-win-2';
    const dbKeys = databasesParam.split(',').filter(key => key.trim());
    
    let allMedios = new Set();
    
    for (const dbKey of dbKeys) {
      const dbConfig = getDatabase(dbKey);
      
      if (!dbConfig) {
        console.warn(`Database ${dbKey} not found, skipping...`);
        continue;
      }
      
      try {
        const UserModel = await getDatabaseModel(dbConfig);
        
        // Get distinct medios from this database
        const medios = await UserModel.distinct('medio');
        medios.forEach(medio => {
          if (medio && medio.trim()) {
            allMedios.add(medio);
          }
        });
        
      } catch (dbError) {
        console.error(`Error fetching medios from database ${dbKey}:`, dbError);
      }
    }
    
    // Convert Set to sorted array
    const mediosArray = Array.from(allMedios).sort();
    
    res.json({
      medios: mediosArray,
      count: mediosArray.length
    });
    
  } catch (error) {
    console.error('Error fetching medios:', error);
    res.status(500).json({ 
      error: 'Failed to fetch medios',
      details: error.message 
    });
  }
});

// Get users who requested payment but didn't complete purchase
router.get('/pending', async (req, res) => {
  try {
    // Check if user wants ALL users
    const loadAll = req.query.loadAll === 'true';
    
    // Get pagination parameters (only if not loading all)
    const page = parseInt(req.query.page) || 1;
    const limit = loadAll ? 0 : Math.min(parseInt(req.query.limit) || 100, 5000);
    const skip = loadAll ? 0 : (page - 1) * limit;
    
    // Get database keys from query parameter (can be multiple, comma-separated)
    const databasesParam = req.query.databases || 'bot-win-2';
    const dbKeys = databasesParam.split(',').filter(key => key.trim());
    
    if (dbKeys.length === 0) {
      return res.status(400).json({ error: 'At least one database must be specified' });
    }
    
    let allUsers = [];
    let combinedInfo = {
      databases: [],
      collections: [],
      totalCount: 0
    };
    
    // Fetch users from all selected databases
    for (const dbKey of dbKeys) {
      const dbConfig = getDatabase(dbKey);
      
      if (!dbConfig) {
        console.warn(`Database ${dbKey} not found, skipping...`);
        continue;
      }
      
      try {
        // Get the appropriate model for this database
        const UserModel = await getDatabaseModel(dbConfig);
        
        // Build query
        let query = UserModel.find({
          whatsapp: { $exists: true, $ne: null, $ne: "" }
        })
        .select('whatsapp estado medio medio_at enviado _id') // Only select needed fields
        .lean() // Use lean() for better performance
        .sort({ medio_at: -1 });
        
        // Apply pagination only if not loading all
        if (!loadAll) {
          query = query.skip(skip).limit(limit);
        }
        
        const users = await query.exec();
        
        // Get total count for this database (for pagination info)
        const totalCount = await UserModel.countDocuments({
          whatsapp: { $exists: true, $ne: null, $ne: "" }
        });
        
        // Add database source to each user for tracking
        const usersWithSource = users.map(user => ({
          ...user,
          _sourceDatabase: dbKey,
          _sourceCollection: dbConfig.collection
        }));
        
        allUsers = allUsers.concat(usersWithSource);
        
        combinedInfo.databases.push(dbConfig.name);
        combinedInfo.collections.push(dbConfig.collection);
        combinedInfo.totalCount += totalCount;
        
      } catch (dbError) {
        console.error(`Error fetching from database ${dbKey}:`, dbError);
        // Continue with other databases even if one fails
      }
    }
    
    // Sort all users by medio_at (most recent first)
    allUsers.sort((a, b) => (b.medio_at || 0) - (a.medio_at || 0));
    
    res.json({
      users: allUsers,
      pagination: {
        page,
        limit: loadAll ? allUsers.length : limit,
        total: combinedInfo.totalCount,
        hasMore: !loadAll && allUsers.length === limit,
        loadedAll: loadAll
      },
      database: dbKeys.length === 1 ? combinedInfo.databases[0] : `${dbKeys.length} bases combinadas`,
      collection: combinedInfo.collections.join(', '),
      count: allUsers.length,
      sourceInfo: {
        selectedDatabases: dbKeys,
        databaseNames: combinedInfo.databases,
        collections: combinedInfo.collections,
        individualCounts: combinedInfo.totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message 
    });
  }
});

// Mark message as sent (SIMPLIFIED - SINGLE BD4 ONLY)
router.post('/mark-sent', async (req, res) => {
  try {
    const { phoneNumber, templateName } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    console.log('🎯 === MARCANDO ENVIADO EN BD4 UNIFICADA ===');
    console.log('📱 Número:', phoneNumber);
    console.log('📋 Plantilla:', templateName);
    console.log('🗄️ Base: BD4 (única base de datos)');
    console.log('==========================================');
    
    // SIMPLE: Solo BD4 existe
    const bd4Config = getDatabase('bot-win-4');
    
    if (!bd4Config) {
      console.error('❌ BD4 no encontrada');
      return res.status(500).json({ 
        error: 'BD4 not configured',
        details: 'Base de datos BD4 no está configurada' 
      });
    }
    
    try {
      const BD4UserModel = await getDatabaseModel(bd4Config);
      
      const currentTimestamp = Math.floor(Date.now() / 1000);
      
      const updateData = {
        enviado: true,
        plantilla_enviada: templateName || 'plantilla-desconocida',
        plantilla_at: currentTimestamp
      };
      
      console.log('📝 Actualizando usuario en BD4:', updateData);
      
      const result = await BD4UserModel.updateOne(
        { whatsapp: phoneNumber },
        { $set: updateData }
      );
      
      console.log('✅ Resultado actualización BD4:', {
        phoneNumber,
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      });
      
      if (result.matchedCount === 0) {
        console.warn('⚠️ Usuario no encontrado en BD4:', phoneNumber);
        return res.status(404).json({ 
          error: 'User not found in BD4',
          details: `Usuario ${phoneNumber} no existe en la base de datos` 
        });
      }
      
      res.json({ 
        success: true,
        strategy: 'bd4_unified',
        database: 'BD4',
        action: 'Usuario actualizado en BD4 unificada',
        updateResults: [{
          database: 'BD4',
          success: result.modifiedCount > 0,
          modifiedCount: result.modifiedCount,
          userData: updateData
        }]
      });
      
    } catch (bd4Error) {
      console.error('❌ Error actualizando BD4:', bd4Error);
      return res.status(500).json({ 
        error: 'Failed to update user in BD4',
        details: bd4Error.message 
      });
    }
    
  } catch (error) {
    console.error('❌ Error general marking message as sent:', error);
    res.status(500).json({ 
      error: 'Failed to mark message as sent',
      details: error.message 
    });
  }
});

export default router;