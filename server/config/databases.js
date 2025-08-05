// Database configurations based on your MongoDB structure
export const databases = {
    'bot-win-4': {
    name: 'Bot WIN+4',
    description: 'Base de datos de usuarios WIN+4',
    uri: 'mongodb+srv://chatbot:Jsdrevolution123.@cluster0.mzz8o50.mongodb.net/bot-WIN+4?retryWrites=true&w=majority',
    collection: 'bot-win+4',
    userCount: 'N/A'
  }
};

export const getDatabase = (dbKey) => {
  return databases[dbKey] || databases['bot-win-4']; // Default fallback to WIN+4 (única BD)
};

export const getAllDatabases = () => {
  return Object.keys(databases).map(key => ({
    key,
    ...databases[key]
  }));
};

export const getDatabaseModel = async (dbConfig) => {
  // Importar mongoose dinámicamente para evitar problemas de importación
  const mongoose = await import('mongoose');
  
  // Crear un esquema flexible para cualquier colección
  const flexibleSchema = new mongoose.Schema({}, { strict: false });
  
  // Usar la colección especificada en la configuración
  const collectionName = dbConfig.collection || 'bot-win+4';
  
  // Crear y retornar el modelo
  return mongoose.model('User', flexibleSchema, collectionName);
};