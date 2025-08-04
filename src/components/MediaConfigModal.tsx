import React, { useState, useEffect } from 'react';
import { X, Upload, Link, Save, Image, Video, FileText } from 'lucide-react';
import { Template } from '../types';

interface MediaConfig {
  templateName: string;
  mediaType: 'image' | 'video' | 'document';
  mediaUrl: string;
  filename?: string;
}

interface MediaConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
  onSave: (config: MediaConfig) => void;
  existingConfig?: MediaConfig;
}

const MediaConfigModal: React.FC<MediaConfigModalProps> = ({
  isOpen,
  onClose,
  template,
  onSave,
  existingConfig
}) => {
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [isValidUrl, setIsValidUrl] = useState<boolean>(false);

  useEffect(() => {
    if (existingConfig) {
      setMediaUrl(existingConfig.mediaUrl);
      setFilename(existingConfig.filename || '');
    } else {
      setMediaUrl('');
      setFilename('');
    }
  }, [existingConfig, isOpen]);

  useEffect(() => {
    // Validate URL
    try {
      const url = new URL(mediaUrl);
      setIsValidUrl(url.protocol === 'http:' || url.protocol === 'https:');
    } catch {
      setIsValidUrl(false);
    }
  }, [mediaUrl]);

  if (!isOpen || !template) return null;

  const headerComponent = template.components?.find(c => c.type === 'HEADER');
  if (!headerComponent || !headerComponent.format) return null;

  const mediaType = headerComponent.format.toLowerCase() as 'image' | 'video' | 'document';

  const getMediaIcon = () => {
    switch (mediaType) {
      case 'image': return <Image className="w-6 h-6" />;
      case 'video': return <Video className="w-6 h-6" />;
      case 'document': return <FileText className="w-6 h-6" />;
      default: return <Upload className="w-6 h-6" />;
    }
  };

  const getMediaTypeLabel = () => {
    switch (mediaType) {
      case 'image': return 'Imagen';
      case 'video': return 'Video';
      case 'document': return 'Documento';
      default: return 'Archivo';
    }
  };

  const getAcceptedFormats = () => {
    switch (mediaType) {
      case 'image': return 'JPG, PNG, GIF (máx. 5MB)';
      case 'video': return 'MP4, 3GPP (máx. 16MB)';
      case 'document': return 'PDF, DOC, DOCX, TXT (máx. 100MB)';
      default: return '';
    }
  };

  const handleSave = () => {
    if (!isValidUrl) return;

    const config: MediaConfig = {
      templateName: template.name,
      mediaType,
      mediaUrl,
      filename: mediaType === 'document' ? filename || 'documento.pdf' : undefined
    };

    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getMediaIcon()}
              <div>
                <h2 className="text-xl font-bold">Configurar {getMediaTypeLabel()}</h2>
                <p className="text-purple-100">Plantilla: {template.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">ℹ️</span>
              </div>
              <span className="font-semibold text-blue-800 dark:text-blue-200">
                ¿Por qué necesito configurar esto?
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              WhatsApp requiere que uses tu propio contenido multimedia hosteado en un servidor público. 
              El contenido debe estar accesible vía HTTPS para garantizar la entrega.
            </p>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL del {getMediaTypeLabel()} *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Link className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className={`pl-10 block w-full rounded-lg border shadow-sm focus:ring-2 focus:ring-offset-2 dark:bg-gray-700 dark:text-white py-3 px-4 ${
                  mediaUrl && !isValidUrl
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500'
                }`}
                placeholder={`https://tu-servidor.com/archivo.${mediaType === 'image' ? 'jpg' : mediaType === 'video' ? 'mp4' : 'pdf'}`}
              />
            </div>
            {mediaUrl && !isValidUrl && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                Por favor ingresa una URL válida (debe comenzar con http:// o https://)
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Formatos aceptados: {getAcceptedFormats()}
            </p>
          </div>

          {/* Filename for documents */}
          {mediaType === 'document' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Archivo (opcional)
              </label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:text-white py-3 px-4"
                placeholder="documento.pdf"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Si no especificas, se usará "documento.pdf"
              </p>
            </div>
          )}

          {/* Preview */}
          {isValidUrl && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Vista Previa:</h4>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <p><strong>Tipo:</strong> {getMediaTypeLabel()}</p>
                <p><strong>URL:</strong> <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-xs">{mediaUrl}</code></p>
                {filename && <p><strong>Nombre:</strong> {filename}</p>}
              </div>
            </div>
          )}

          {/* Requirements */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">📋 Requisitos Importantes:</h4>
            <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
              <li>• El archivo debe estar en un <strong>servidor público accesible</strong></li>
              <li>• La URL debe usar <strong>HTTPS</strong> (recomendado) o HTTP</li>
              <li>• El servidor debe permitir <strong>acceso directo</strong> al archivo</li>
              <li>• Respeta los <strong>límites de tamaño</strong> de WhatsApp</li>
              <li>• El contenido debe cumplir las <strong>políticas de WhatsApp</strong></li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!isValidUrl}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaConfigModal;