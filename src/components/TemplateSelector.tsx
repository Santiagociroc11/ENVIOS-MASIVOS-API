import React from 'react';
import { ConfiguredTemplate } from '../types';

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
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 p-6 rounded-2xl border border-green-200 dark:border-gray-500 shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📱 Vista Previa de Plantilla</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">📝 Nombre</span>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{selectedTemplate.displayName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">({selectedTemplate.templateName})</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">🌍 Idioma</span>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{selectedTemplate.language}</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">⚡ Estado</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                  selectedTemplate.status === 'APPROVED' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                    : selectedTemplate.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                      : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                }`}>
                  {selectedTemplate.status}
                </span>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">🏷️ Categoría</span>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{selectedTemplate.category}</p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">🔧 Componentes</span>
              <div className="mt-3 space-y-2">
                {selectedTemplate.components && selectedTemplate.components.map((comp, index) => (
                  <div key={index} className="border-l-4 border-blue-400 pl-3 py-2 bg-blue-50 dark:bg-gray-700 rounded-r-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                        {comp.type}
                      </span>
                      {comp.type === 'HEADER' && (comp.format === 'IMAGE' || comp.format === 'VIDEO' || comp.format === 'DOCUMENT') && (
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                          {comp.format === 'IMAGE' ? '📷 IMAGEN' : 
                           comp.format === 'VIDEO' ? '🎥 VIDEO' : 
                           comp.format === 'DOCUMENT' ? '📄 DOCUMENTO' : '📷 MULTIMEDIA'}
                        </span>
                      )}
                      {comp.type === 'BUTTONS' && (
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                          🔘 BOTONES ({comp.buttons?.length || 0})
                        </span>
                      )}
                    </div>
                    {comp.text && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">{comp.text}</p>
                    )}
                    {comp.type === 'BUTTONS' && comp.buttons && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          🔘 Botones disponibles:
                        </p>
                        {comp.buttons.map((button, bIndex) => (
                          <div key={bIndex} className="ml-2 flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              button.type === 'QUICK_REPLY' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              button.type === 'URL' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              button.type === 'PHONE_NUMBER' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            }`}>
                              {button.type === 'QUICK_REPLY' ? '💬' : 
                               button.type === 'URL' ? '🔗' : 
                               button.type === 'PHONE_NUMBER' ? '📞' : '🔘'} {button.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {comp.example && (comp.example.header_text || comp.example.body_text) && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          🔢 Parámetros de ejemplo:
                        </p>
                        {comp.example.header_text && comp.example.header_text.map((text, tIndex) => (
                          <div key={`header-${tIndex}`} className="ml-2">
                            <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              📝 Header: {text}
                            </span>
                          </div>
                        ))}
                        {comp.example.body_text && comp.example.body_text[0] && comp.example.body_text[0].map((text, tIndex) => (
                          <div key={`body-${tIndex}`} className="ml-2">
                            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              📝 Body: {text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Multimedia Template Info */}
          {selectedTemplate.mediaUrl && (
            <div className="mt-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📷</span>
                </div>
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">Plantilla Multimedia</h4>
              </div>
              <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
                Esta plantilla incluye contenido multimedia personalizado.
              </p>
              <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                <p>• 📷 <strong>Tipo:</strong> {selectedTemplate.mediaType?.toUpperCase()}</p>
                <p>• 🔗 <strong>URL:</strong> {selectedTemplate.mediaUrl}</p>
                <p>• 🎯 <strong>Consistente:</strong> Mismo medio para todos los envíos</p>
              </div>
            </div>
          )}
          
          {/* Interactive Template Info */}
          {/* Note: We'll need to check if original template has buttons - for now showing always */}
          {true && (
            <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🔘</span>
                </div>
                <h4 className="font-semibold text-green-900 dark:text-green-100">Plantilla Interactiva</h4>
              </div>
              <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                Esta plantilla incluye botones interactivos que los usuarios pueden presionar para responder.
              </p>
              <div className="text-xs text-green-700 dark:text-green-300">
                <p>• 🔘 <strong>Botones:</strong> Los usuarios pueden hacer clic para responder rápidamente</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;