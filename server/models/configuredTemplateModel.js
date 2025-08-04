import mongoose from 'mongoose';

const configuredTemplateSchema = new mongoose.Schema({
  templateId: {
    type: String,
    required: true
  },
  templateName: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  mediaUrl: {
    type: String
  },
  mediaType: {
    type: String,
    enum: ['video', 'image', 'document']
  },
  headerText: [{
    type: String
  }],
  bodyText: [[{
    type: String
  }]],
  buttonParams: {
    type: Map,
    of: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('ConfiguredTemplate', configuredTemplateSchema);