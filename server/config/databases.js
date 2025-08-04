// Database configurations
export const databases = {
  'bot-win-2': {
    name: 'Bot WIN+2',
    description: 'Base de datos principal con usuarios de WIN+2',
    uri: 'mongodb+srv://chatbot:Jsdrevolution123.@cluster0.mzz8o50.mongodb.net/bot-WIN+2?retryWrites=true&w=majority',
    collection: 'bot-win+2',
    userCount: '149,399+'
  },
  'bot-win-3': {
    name: 'Bot WIN+3',
    description: 'Base de datos de usuarios WIN+3',
    uri: 'mongodb+srv://chatbot:Jsdrevolution123.@cluster0.mzz8o50.mongodb.net/bot-WIN+3?retryWrites=true&w=majority',
    collection: 'bot-win+3',
    userCount: 'N/A'
  },
  'leads-database': {
    name: 'Leads Database',
    description: 'Base de datos de leads y prospectos',
    uri: 'mongodb+srv://chatbot:Jsdrevolution123.@cluster0.mzz8o50.mongodb.net/leads-db?retryWrites=true&w=majority',
    collection: 'leads',
    userCount: 'N/A'
  }
  // Puedes agregar más bases de datos aquí
};

export const getDatabase = (dbKey) => {
  return databases[dbKey] || databases['bot-win-2']; // Default fallback
};

export const getAllDatabases = () => {
  return Object.keys(databases).map(key => ({
    key,
    ...databases[key]
  }));
};