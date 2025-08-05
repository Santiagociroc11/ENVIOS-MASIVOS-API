import React from 'react';
import { Play, Download, MessageCircle, Phone, ExternalLink } from 'lucide-react';
import { ConfiguredTemplate } from '../types';

interface WhatsAppPreviewProps {
  configuredTemplate: ConfiguredTemplate;
}

const WhatsAppPreview: React.FC<WhatsAppPreviewProps> = ({ configuredTemplate }) => {

  // Process template text with parameters
  const processTemplateText = (text: string, params: string[] = []) => {
    let processedText = text;
    params.forEach((param, index) => {
      processedText = processedText.replace(`{{${index + 1}}}`, param);
    });
    return processedText;
  };

  // Format WhatsApp text styles (bold, italic, strikethrough, monospace)
  const formatWhatsAppText = (text: string) => {
    const parts: Array<{ text: string; bold?: boolean; italic?: boolean; strikethrough?: boolean; monospace?: boolean }> = [];
    let currentText = text;
    let index = 0;

    while (index < currentText.length) {
      // Bold: *text*
      const boldMatch = currentText.substring(index).match(/^\*([^*]+)\*/);
      if (boldMatch) {
        if (index > 0) {
          parts.push({ text: currentText.substring(0, index) });
          currentText = currentText.substring(index);
          index = 0;
        }
        parts.push({ text: boldMatch[1], bold: true });
        currentText = currentText.substring(boldMatch[0].length);
        continue;
      }

      // Italic: _text_
      const italicMatch = currentText.substring(index).match(/^_([^_]+)_/);
      if (italicMatch) {
        if (index > 0) {
          parts.push({ text: currentText.substring(0, index) });
          currentText = currentText.substring(index);
          index = 0;
        }
        parts.push({ text: italicMatch[1], italic: true });
        currentText = currentText.substring(italicMatch[0].length);
        continue;
      }

      // Strikethrough: ~text~
      const strikeMatch = currentText.substring(index).match(/^~([^~]+)~/);
      if (strikeMatch) {
        if (index > 0) {
          parts.push({ text: currentText.substring(0, index) });
          currentText = currentText.substring(index);
          index = 0;
        }
        parts.push({ text: strikeMatch[1], strikethrough: true });
        currentText = currentText.substring(strikeMatch[0].length);
        continue;
      }

      // Monospace: ```text```
      const monoMatch = currentText.substring(index).match(/^```([^`]+)```/);
      if (monoMatch) {
        if (index > 0) {
          parts.push({ text: currentText.substring(0, index) });
          currentText = currentText.substring(index);
          index = 0;
        }
        parts.push({ text: monoMatch[1], monospace: true });
        currentText = currentText.substring(monoMatch[0].length);
        continue;
      }

      index++;
    }

    if (currentText) {
      parts.push({ text: currentText });
    }

    return parts;
  };

  // Render formatted text
  const renderFormattedText = (text: string, className: string = "") => {
    const parts = formatWhatsAppText(text);
    
    return (
      <span className={className}>
        {parts.map((part, index) => (
          <span
            key={index}
            className={`
              ${part.bold ? 'font-bold' : ''}
              ${part.italic ? 'italic' : ''}
              ${part.strikethrough ? 'line-through' : ''}
              ${part.monospace ? 'font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs' : ''}
            `.trim()}
          >
            {part.text}
          </span>
        ))}
      </span>
    );
  };

  // Render header component
  const renderHeader = () => {
    if (!configuredTemplate.components) return null;

    const headerComponent = configuredTemplate.components.find(c => c.type === 'HEADER');
    if (!headerComponent) return null;

    // Media header (image, video, document)
    if (configuredTemplate.mediaUrl && configuredTemplate.mediaType) {
      return (
        <div className="mb-3">
          {configuredTemplate.mediaType === 'image' && (
            <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-video">
              <img 
                src={configuredTemplate.mediaUrl} 
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2VuPC90ZXh0Pjwvc3ZnPg==';
                }}
              />
            </div>
          )}
          
          {configuredTemplate.mediaType === 'video' && (
            <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video">
              <video 
                src={configuredTemplate.mediaUrl}
                className="w-full h-full object-cover"
                controls
                preload="metadata"
                onError={(e) => {
                  // Fallback to play icon if video fails to load
                  (e.target as HTMLVideoElement).style.display = 'none';
                  const fallback = (e.target as HTMLVideoElement).nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900" style={{ display: 'none' }}>
                <Play className="w-12 h-12 text-white opacity-80" />
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  🎥 Video no disponible
                </div>
              </div>
            </div>
          )}
          
          {configuredTemplate.mediaType === 'document' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Documento</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {configuredTemplate.mediaUrl?.split('/').pop()?.split('.').pop()?.toUpperCase() || 'Archivo'} adjunto
                </p>
                <a 
                  href={configuredTemplate.mediaUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Ver documento
                </a>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Text header
    if (headerComponent.text && configuredTemplate.headerText) {
      const headerText = processTemplateText(headerComponent.text, configuredTemplate.headerText);
      return (
        <div className="mb-3">
          {renderFormattedText(headerText, "font-semibold text-gray-900 dark:text-white text-sm")}
        </div>
      );
    }

    return null;
  };

  // Render body component
  const renderBody = () => {
    if (!configuredTemplate.components) return null;

    const bodyComponent = configuredTemplate.components.find(c => c.type === 'BODY');
    if (!bodyComponent || !bodyComponent.text) return null;

    const bodyParams = configuredTemplate.bodyText && configuredTemplate.bodyText.length > 0 
      ? configuredTemplate.bodyText[0] 
      : [];
    
    const bodyText = processTemplateText(bodyComponent.text, bodyParams);

    return (
      <div className="mb-3">
        <div className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-line">
          {renderFormattedText(bodyText)}
        </div>
      </div>
    );
  };

  // Render footer component
  const renderFooter = () => {
    if (!configuredTemplate.components) return null;

    const footerComponent = configuredTemplate.components.find(c => c.type === 'FOOTER');
    if (!footerComponent || !footerComponent.text) return null;

    return (
      <div className="mb-3">
        {renderFormattedText(footerComponent.text, "text-gray-500 dark:text-gray-400 text-xs")}
      </div>
    );
  };

  // Render buttons component
  const renderButtons = () => {
    if (!configuredTemplate.components) return null;

    const buttonsComponent = configuredTemplate.components.find(c => c.type === 'BUTTONS');
    if (!buttonsComponent || !buttonsComponent.buttons) return null;

    return (
      <div className="space-y-2 mt-3">
        {buttonsComponent.buttons.map((button, index) => (
          <button
            key={index}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 border border-blue-500 text-blue-500 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            {button.type === 'QUICK_REPLY' && <MessageCircle className="w-4 h-4" />}
            {button.type === 'PHONE_NUMBER' && <Phone className="w-4 h-4" />}
            {button.type === 'URL' && <ExternalLink className="w-4 h-4" />}
            {renderFormattedText(button.text)}
          </button>
        ))}
      </div>
    );
  };

  if (!configuredTemplate.components || configuredTemplate.components.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
          No se encontraron componentes de plantilla para mostrar el preview.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* WhatsApp Header */}
      <div className="bg-green-600 text-white p-3 flex items-center space-x-3">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <MessageCircle className="w-4 h-4" />
        </div>
        <div>
          <p className="font-medium text-sm">Preview de WhatsApp</p>
          <p className="text-xs text-green-100">Así se verá tu mensaje</p>
        </div>
      </div>

      {/* Message Content */}
      <div className="p-4 bg-green-50 dark:bg-gray-900 min-h-[200px]">
        {/* Message Bubble */}
        <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm max-w-xs ml-auto relative">
          {/* Message Content */}
          <div>
            {renderHeader()}
            {renderBody()}
            {renderFooter()}
            {renderButtons()}
          </div>

          {/* Message Status */}
          <div className="flex items-center justify-end space-x-1 mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">12:34</span>
            <div className="flex space-x-1">
              <div className="w-3 h-3 text-blue-500">
                <svg viewBox="0 0 16 15" className="fill-current">
                  <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.063-.51z"/>
                  <path d="M10.833 8.75a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51l-.478-.372a.365.365 0 0 0-.51.063L10.833 8.75z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Message Tail */}
          <div className="absolute right-0 top-2 w-0 h-0 border-l-8 border-l-white dark:border-l-gray-700 border-t-4 border-t-transparent border-b-4 border-b-transparent -mr-2"></div>
        </div>

        {/* Template Info */}
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            📱 Plantilla: {configuredTemplate.displayName}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPreview;