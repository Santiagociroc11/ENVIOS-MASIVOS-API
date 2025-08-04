import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  templateName: {
    type: String,
    required: true
  },
  templateLanguage: {
    type: String,
    default: 'es'
  },
  databases: [{
    type: String,
    required: true
  }],
  sentUsers: [{
    whatsapp: String,
    database: String,
    sentAt: Date,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'replied', 'failed'],
      default: 'sent'
    },
    messageId: String,
    error: String
  }],
  totalSent: {
    type: Number,
    default: 0
  },
  totalSuccess: {
    type: Number,
    default: 0
  },
  totalFailed: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  createdBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true
});

export default mongoose.model('Campaign', campaignSchema);