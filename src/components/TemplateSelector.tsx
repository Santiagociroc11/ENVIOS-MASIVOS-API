import React from 'react';
import { Template } from '../types';

interface TemplateSelectorProps {
  templates: Template[];
  selectedTemplate: Template | null;
  onSelectTemplate: (template: Template | null) => void;
  loading: boolean;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ 
  templates, 
  selectedTemplate, 
  onSelectTemplate,
  loading
}) => {
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
            value={selectedTemplate?.name || ''}
            onChange={(e) => {
              const selected = templates.find(t => t.name === e.target.value) || null;
              onSelectTemplate(selected);
            }}
          >
            <option value="">✨ Elige una plantilla para comenzar</option>
            {templates.map((template) => (
              <option key={template.name} value={template.name}>
                📱 {template.name} ({template.status})
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
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{selectedTemplate.name}</p>
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
                    </div>
                    {comp.text && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">{comp.text}</p>
                    )}
                    {comp.parameters && comp.parameters.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        🔢 Requiere {comp.parameters.length} parámetro{comp.parameters.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;