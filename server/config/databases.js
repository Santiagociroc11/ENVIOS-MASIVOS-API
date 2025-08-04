// Database configurations based on your MongoDB structure
export const databases = {
  'bot-win': {
    name: 'Bot WIN',
    description: 'Base de datos principal de usuarios WIN',
    uri: 'mongodb+srv://chatbot:Jsdrevolution123.@cluster0.mzz8o50.mongodb.net/bot-WIN?retryWrites=true&w=majority',
    collection: 'bot-win',
    userCount: 'N/A'
  },
  'bot-win-2': {
    name: 'Bot WIN+2',
    description: 'Base de datos de usuarios WIN+2',
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
  'bot-win-4': {
    name: 'Bot WIN+4',
    description: 'Base de datos de usuarios WIN+4',
    uri: 'mongodb+srv://chatbot:Jsdrevolution123.@cluster0.mzz8o50.mongodb.net/bot-WIN+4?retryWrites=true&w=majority',
    collection: 'bot-win+4',
    userCount: 'N/A'
  }
};

export const getDatabase = (dbKey) => {
  return databases[dbKey] || databases['bot-win-2']; // Default fallback to WIN+2
};

export const getAllDatabases = () => {
  return Object.keys(databases).map(key => ({
    key,
    ...databases[key]
  }));
};