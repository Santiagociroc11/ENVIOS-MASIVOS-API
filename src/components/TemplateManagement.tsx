import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Edit3, Trash2, Save, X, Video, Image, FileText, ExternalLink, CheckCircle2, AlertCircle, Eye } from 'lucide-react';

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  status: string;
  components: Array<{
    type: string;
    format?: string;
    text?: string;
    example?: {
      header_handle?: string[];
      header_text?: string[];
      body_text?: string[][];
    };
    buttons?: Array<{
      type: string;
      text: string;
      url?: string;
      example?: string[];
    }>;
  }>;
}

interface ConfiguredTemplate {
  _id?: string;
  templateId: string;
  templateName: string;
  displayName: string;
  language: string;
  category: string;
  status: string;
  mediaUrl?: string;
  mediaType?: 'video' | 'image' | 'document';
  headerText?: string[];
  bodyText?: string[];
  buttonParams?: { [key: string]: string };
  createdAt?: Date;
  updatedAt?: Date;
  isActive: boolean;
}

const TemplateManagement: React.FC = () => {
  const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsAppTemplate[]>([]);
  const [configuredTemplates, setConfiguredTemplates] = useState<ConfiguredTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ConfiguredTemplate | null>(null);
  const [formData, setFormData] = useState<Partial<ConfiguredTemplate>>({});

  useEffect(() => {
    loadWhatsAppTemplates();
    loadConfiguredTemplates();
  }, []);

  const loadWhatsAppTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates');
      const templates = await response.json();
      setWhatsappTemplates(templates);
    } catch (error) {
      console.error('Error loading WhatsApp templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfiguredTemplates = async () => {
    try {
      const response = await fetch('/api/configured-templates');
      const templates = await response.json();
      setConfiguredTemplates(templates);
    } catch (error) {
      console.error('Error loading configured templates:', error);
    }
  };

  const handleCreateTemplate = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      templateId: template.id,
      templateName: template.name,
      displayName: template.name,
      language: template.language,
      category: template.category,
      status: template.status,
      isActive: true
    });
    
    // Pre-fill media if exists in template
    const headerComponent = template.components.find(c => c.type === 'HEADER' && c.format);
    if (headerComponent) {
      setFormData(prev => ({
        ...prev,
        mediaType: headerComponent.format?.toLowerCase() as 'video' | 'image' | 'document',
        mediaUrl: headerComponent.example?.header_handle?.[0] || ''
      }));
    }
    
    setShowCreateModal(true);
  };

  const handleEditTemplate = (template: ConfiguredTemplate) => {
    setEditingTemplate(template);
    setFormData({ ...template });
    setShowEditModal(true);
  };

  const handleSaveTemplate = async () => {
    try {
      const url = editingTemplate ? `/api/configured-templates/${editingTemplate._id}` : '/api/configured-templates';
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          updatedAt: new Date()
        })
      });
      
      if (response.ok) {
        await loadConfiguredTemplates();
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta plantilla configurada?')) {
      try {
        const response = await fetch(`/api/configured-templates/${templateId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await loadConfiguredTemplates();
        }
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handleToggleActive = async (template: ConfiguredTemplate) => {
    try {
      const response = await fetch(`/api/configured-templates/${template._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          isActive: !template.isActive,
          updatedAt: new Date()
        })
      });
      
      if (response.ok) {
        await loadConfiguredTemplates();
      }
    } catch (error) {
      console.error('Error toggling template status:', error);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedTemplate(null);
    setEditingTemplate(null);
    setFormData({});
  };

  const getMediaIcon = (type?: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl p-8 border border-gray-200/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📋 Gestión de Plantillas</h2>
              <p className="text-gray-600 dark:text-gray-300">Configura tus plantillas de WhatsApp con medios personalizados</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Plantillas Configuradas</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{configuredTemplates.length}</p>
          </div>
        </div>
      </div>

      {/* WhatsApp Templates Available */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl p-8 border border-gray-200/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">📱 Plantillas de WhatsApp Disponibles</h3>
          <button
            onClick={loadWhatsAppTemplates}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Cargando plantillas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whatsappTemplates.map((template) => (
              <div key={template.id} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{template.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(template.status)}`}>
                    {template.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Categoría:</span> {template.category}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Idioma:</span> {template.language}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Componentes:</span> {template.components.length}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {template.components.map((comp, index) => (
                    <div key={index} className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-xs">
                      {comp.type === 'HEADER' && comp.format && getMediaIcon(comp.format.toLowerCase())}
                      <span className="text-blue-800 dark:text-blue-200">{comp.type}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleCreateTemplate(template)}
                  disabled={template.status !== 'APPROVED'}
                  className="w-full mt-4 flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Configurar Plantilla
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configured Templates */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl border border-gray-200/20 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">⚙️ Plantillas Configuradas</h3>
        </div>

        {configuredTemplates.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay plantillas configuradas</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Configura una plantilla de WhatsApp para comenzar a enviar mensajes personalizados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Plantilla
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Medio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Activa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {configuredTemplates.map((template) => (
                  <tr key={template._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {template.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {template.displayName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {template.templateName} • {template.language}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {template.mediaUrl ? (
                        <div className="flex items-center space-x-2">
                          {getMediaIcon(template.mediaType)}
                          <span className="text-sm text-gray-900 dark:text-white capitalize">
                            {template.mediaType}
                          </span>
                          <a
                            href={template.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sin medio</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(template.status)}`}>
                        {template.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(template)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          template.isActive ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            template.isActive ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template._id!)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-6 h-6" />
                  <h2 className="text-xl font-bold">
                    {editingTemplate ? 'Editar Plantilla' : 'Configurar Plantilla'}
                  </h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre para Mostrar
                  </label>
                  <input
                    type="text"
                    value={formData.displayName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Nombre descriptivo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Plantilla Original
                  </label>
                  <input
                    type="text"
                    value={formData.templateName || ''}
                    disabled
                    className="block w-full rounded-lg border-gray-300 shadow-sm bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300"
                  />
                </div>
              </div>

              {selectedTemplate?.components.find(c => c.type === 'HEADER' && c.format) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL del Medio ({formData.mediaType})
                  </label>
                  <input
                    type="url"
                    value={formData.mediaUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, mediaUrl: e.target.value }))}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="https://ejemplo.com/video.mp4"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    URL pública del {formData.mediaType} que se enviará con la plantilla
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Plantilla activa (disponible para envíos)
                </label>
              </div>

              {selectedTemplate && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Vista Previa de la Plantilla</h4>
                  <div className="space-y-2 text-sm">
                    {selectedTemplate.components.map((comp, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {comp.type}:
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {comp.text || (comp.format && `${comp.format} Media`) || 'Interactive Component'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4 mr-2 inline" />
                  {editingTemplate ? 'Actualizar' : 'Guardar'} Plantilla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManagement;