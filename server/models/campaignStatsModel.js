import mongoose from 'mongoose';

const campaignStatsSchema = new mongoose.Schema({
  // Información de la campaña
  campaignId: {
    type: String,
    required: true,
    unique: true
  },
  templateName: {
    type: String,
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  totalSent: {
    type: Number,
    required: true
  },
  
  // Snapshot de usuarios al momento del envío
  usersSnapshot: [{
    whatsapp: { type: String, required: true },
    estadoInicial: { type: String, default: 'desconocido' },
    medioInicial: { type: String, default: '' },
    pagadoAtInicial: { type: Number, default: null },
    upsellAtInicial: { type: Number, default: null },
    plantillaAtInicial: { type: Number, default: null },
    flagMasivoInicial: { type: Boolean, default: false },
    ingresoInicial: { type: Number, default: null },
    enviado: { type: Boolean, default: true },
    sourceDatabase: { type: String, required: true }
  }],
  
  // Configuración del envío
  databases: [String],
  sendingOrder: {
    type: String,
    enum: ['asc', 'desc'],
    default: 'desc'
  },
  
  // Metadatos
  createdBy: String,
  notes: String
}, {
  timestamps: true
});

// Índices para consultas optimizadas
campaignStatsSchema.index({ sentAt: -1 });
campaignStatsSchema.index({ templateName: 1 });
campaignStatsSchema.index({ 'usersSnapshot.whatsapp': 1 });

const CampaignStats = mongoose.model('CampaignStats', campaignStatsSchema);

export default CampaignStats;