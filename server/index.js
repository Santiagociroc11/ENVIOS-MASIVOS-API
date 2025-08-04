import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// MongoDB connection for campaigns and system data
const CAMPAIGNS_DB_URI = 'mongodb+srv://chatbot:Jsdrevolution123.@cluster0.mzz8o50.mongodb.net/whatsapp-campaigns?retryWrites=true&w=majority';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes
import templateRoutes from './routes/templateRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import databaseRoutes from './routes/databaseRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';

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

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint with API info
app.get('/', (req, res) => {
  // Check if this is an API request (Accept header contains application/json)
  const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
  
  if (acceptsJson) {
    res.json({
      message: "WhatsApp Template Messenger API",
      version: "1.0.0",
      endpoints: {
        health: "/health",
        databases: "/api/databases",
        templates: "/api/templates",
        users: "/api/users/pending",
        messages: "/api/messages/send"
      }
    });
  } else {
    // Serve the React app for browser requests
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  }
});

// API Routes
app.use('/api/databases', databaseRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/campaigns', campaignRoutes);

// Catch-all for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  // If it's an API route that wasn't found, don't serve the frontend
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      error: 'API endpoint not found',
      path: req.path,
      method: req.method
    });
  }
  
  // For all other routes, serve the React app
  res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    path: req.path
  });
});

// Connect to campaigns database
mongoose.connect(CAMPAIGNS_DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to campaigns database: whatsapp-campaigns');
})
.catch((error) => {
  console.error('❌ Error connecting to campaigns database:', error);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🗄️ Databases: http://localhost:${PORT}/api/databases`);
});