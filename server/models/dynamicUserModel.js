import mongoose from 'mongoose';

// Cache for database connections
const connections = new Map();

// Generic schema for flexible data structure
const flexibleSchema = new mongoose.Schema({}, { strict: false });

export const getDatabaseModel = async (dbConfig) => {
  const { uri, collection } = dbConfig;
  
  // Create a unique key for this connection
  const connectionKey = `${uri}-${collection}`;
  
  // Check if we already have this connection
  if (connections.has(connectionKey)) {
    return connections.get(connectionKey);
  }
  
  try {
    // Create new connection
    const connection = await mongoose.createConnection(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });
    
    // Create model with the specified collection name
    const Model = connection.model('User', flexibleSchema, collection);
    
    // Cache the model
    connections.set(connectionKey, Model);
    
    console.log(`✅ Connected to database: ${collection}`);
    return Model;
    
  } catch (error) {
    console.error(`❌ Error connecting to database ${collection}:`, error);
    throw error;
  }
};

export const closeConnection = async (dbConfig) => {
  const { uri, collection } = dbConfig;
  const connectionKey = `${uri}-${collection}`;
  
  if (connections.has(connectionKey)) {
    const model = connections.get(connectionKey);
    await model.db.close();
    connections.delete(connectionKey);
    console.log(`🔌 Closed connection to: ${collection}`);
  }
};