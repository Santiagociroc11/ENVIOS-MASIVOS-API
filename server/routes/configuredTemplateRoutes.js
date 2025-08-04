import express from 'express';
import ConfiguredTemplate from '../models/configuredTemplateModel.js';

const router = express.Router();

// Get all configured templates
router.get('/', async (req, res) => {
  try {
    const templates = await ConfiguredTemplate.find()
      .sort({ createdAt: -1 });
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching configured templates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch configured templates',
      details: error.message 
    });
  }
});

// Get active configured templates (for sending)
router.get('/active', async (req, res) => {
  try {
    console.log('🔍 Fetching active configured templates...');
    const templates = await ConfiguredTemplate.find({ 
      isActive: true,
      status: 'APPROVED'
    }).sort({ displayName: 1 });
    
    console.log('📋 Found active templates:', templates.length);
    console.log('📊 Templates data:', templates);
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching active templates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch active templates',
      details: error.message 
    });
  }
});

// Get single configured template
router.get('/:id', async (req, res) => {
  try {
    const template = await ConfiguredTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ 
      error: 'Failed to fetch template',
      details: error.message 
    });
  }
});

// Create new configured template
router.post('/', async (req, res) => {
  try {
    const template = new ConfiguredTemplate(req.body);
    await template.save();
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ 
      error: 'Failed to create template',
      details: error.message 
    });
  }
});

// Update configured template
router.put('/:id', async (req, res) => {
  try {
    const template = await ConfiguredTemplate.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ 
      error: 'Failed to update template',
      details: error.message 
    });
  }
});

// Delete configured template
router.delete('/:id', async (req, res) => {
  try {
    const template = await ConfiguredTemplate.findByIdAndDelete(req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ 
      error: 'Failed to delete template',
      details: error.message 
    });
  }
});

export default router;