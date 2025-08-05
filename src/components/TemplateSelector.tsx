import React from 'react';
import { ConfiguredTemplate } from '../types';
import WhatsAppPreview from './WhatsAppPreview';

interface TemplateSelectorProps {
  templates: ConfiguredTemplate[];
  selectedTemplate: ConfiguredTemplate | null;
  onSelectTemplate: (template: ConfiguredTemplate | null) => void;
  loading: boolean;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ 
  templates, 
  selectedTemplate, 
  onSelectTemplate,
  loading
}) => {
  // Debug log
  React.useEffect(() => {
    console.log('🎯 TemplateSelector - Templates received:', templates);
    console.log('📊 TemplateSelector - Templates count:', templates.length);
  }, [templates]);

  // Log template object when selected
  React.useEffect(() => {
    if (selectedTemplate) {
      console.log('🎯 Template Seleccionado:', selectedTemplate);
      console.log('📋 Nombre:', selectedTemplate.displayName);
      console.log('🌍 Idioma:', selectedTemplate.language);
      console.log('⚡ Estado:', selectedTemplate.status);
      console.log('🏷️ Categoría:', selectedTemplate.category);
      console.log('📄 Objeto Completo:', JSON.stringify(selectedTemplate, null, 2));
    }
  }, [selectedTemplate]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl w-full"></div>
        <div className="h-40 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          🎯 Seleccionar Plantilla de WhatsApp
        </label>
        <div className="relative">
          <select
            className="block w-full rounded-xl border-gray-300 shadow-lg focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg py-4 pl-4 pr-10 transition-all duration-200 hover:shadow-xl"
            value={selectedTemplate?._id || ''}
            onChange={(e) => {
              const selected = templates.find(t => t._id === e.target.value) || null;
              onSelectTemplate(selected);
            }}
          >
            <option value="">✨ Elige una plantilla para comenzar</option>
            {templates.map((template) => (
              <option key={template._id} value={template._id}>
                📱 {template.displayName} ({template.status})
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {selectedTemplate && (
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📱</span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Preview de WhatsApp</h4>
              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full font-medium">
                Vista Previa en Tiempo Real
              </span>
            </div>
            <WhatsAppPreview configuredTemplate={selectedTemplate} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;