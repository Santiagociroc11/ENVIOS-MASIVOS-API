import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Routes
import templateRoutes from './routes/templateRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

const username = "chatbot";
const password = "Jsdrevolution123.";
const cluster = "cluster0.mzz8o50.mongodb.net";
const dbName = "bot-WIN+2";
const dbURI = `mongodb+srv://${username}:${password}@${cluster}/${dbName}?retryWrites=true&w=majority`;

dotenv.config();

// Debug: Verificar variables de entorno
console.log('🔍 Verificando variables de entorno:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('META_ACCESS_TOKEN:', process.env.META_ACCESS_TOKEN ? '✅ Configurado' : '❌ No encontrado');
console.log('FROM_PHONE_NUMBER_ID:', process.env.FROM_PHONE_NUMBER_ID ? '✅ Configurado' : '❌ No encontrado');
console.log('WHATSAPP_BUSINESS_ACCOUNT_ID:', process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ? '✅ Configurado' : '❌ No encontrado');
console.log('---');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB with increased timeout and additional options
mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
  })
  .then(() => console.log("Conexión exitosa a MongoDB Atlas"))
  .catch((err) => console.error("Error conectando a MongoDB Atlas:", err));

// Add error handler for MongoDB connection
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// API Routes
app.use('/api/templates', templateRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});