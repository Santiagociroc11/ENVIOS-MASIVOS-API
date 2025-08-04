import React, { useState } from 'react';
import { Send, Phone, CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import { Template } from '../types';
import { sendTemplateMessage } from '../api/services';

interface TestMessagePanelProps {
  selectedTemplate: Template | null;
  selectedDatabases: string[];
}

interface TestResult {
  success: boolean;
  message: string;
  timestamp: Date;
  messageId?: string;
  diagnostics?: any;
  whatsappResponse?: any;
}

const TestMessagePanel: React.FC<TestMessagePanelProps> = ({
  selectedTemplate,
  selectedDatabases
}) => {
  const [testNumber, setTestNumber] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);

  const handleTestSend = async () => {
    if (!selectedTemplate || !testNumber.trim()) return;

    console.log('🧪 Iniciando Envío de Prueba...');
    console.log('📱 Número:', testNumber.trim());
    console.log('📋 Plantilla:', selectedTemplate.name);
    console.log('🗄️ Bases de Datos:', selectedDatabases);
    console.log('🎯 Template Completo:', selectedTemplate);

    setIsSending(true);
    setTestResult(null);

    try {
      const result = await sendTemplateMessage(testNumber.trim(), selectedTemplate.name, selectedDatabases);
      
      console.log('📤 Resultado del Envío:', result);
      
      setTestResult({
        success: result.success,
        message: result.success 
          ? `✅ Mensaje enviado a WhatsApp API (ID: ${result.messageId?.slice(-8) || 'N/A'})`
          : `❌ Error: ${result.error}`,
        timestamp: new Date(),
        messageId: result.messageId,
        diagnostics: result.diagnostics,
        whatsappResponse: result.whatsappResponse
      });
    } catch (error) {
      console.error('❌ Error en Envío de Prueba:', error);
      setTestResult({
        success: false,
        message: `❌ Error de conexión: ${error}`,
        timestamp: new Date(),
        diagnostics: null
      });
    } finally {
      setIsSending(false);
    }
  };

  const checkMessageStatus = async () => {
    if (!testResult?.messageId) return;
    
    setCheckingStatus(true);
    try {
      const response = await fetch(`/api/messages/status/${testResult.messageId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('📱 Message Status:', data.status);
        alert(`Estado del mensaje: ${JSON.stringify(data.status, null, 2)}`);
      } else {
        alert(`Error al verificar estado: ${data.error}`);
      }
    } catch (error) {
      console.error('Error checking status:', error);
      alert('Error al verificar el estado del mensaje');
    } finally {
      setCheckingStatus(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as Colombian number if it starts with 57
    if (digits.startsWith('57') && digits.length <= 13) {
      return digits;
    }
    
    // If it starts with 3 (Colombian mobile), add 57 prefix
    if (digits.startsWith('3') && digits.length === 10) {
      return '57' + digits;
    }
    
    return digits;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setTestNumber(formatted);
  };

  const isValidPhone = testNumber.length >= 12 && testNumber.startsWith('57');

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 p-6 rounded-2xl border border-yellow-200 dark:border-gray-500 shadow-lg">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
          <Phone className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🧪 Envío de Prueba</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              📱 Número de WhatsApp
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={testNumber}
                onChange={handlePhoneChange}
                placeholder="573136298562"
                className="pl-10 block w-full rounded-xl border-gray-300 shadow-lg focus:border-yellow-500 focus:ring-yellow-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white py-3 px-4 text-sm"
                disabled={isSending}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Formato: 57 + número (ej: 573136298562)
            </p>
          </div>

          <button
            onClick={handleTestSend}
            disabled={!selectedTemplate || !isValidPhone || isSending}
            className={`w-full flex items-center justify-center px-6 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
              selectedTemplate && isValidPhone && !isSending
                ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSending ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Prueba
              </>
            )}
          </button>
        </div>

        {/* Status Section */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado de Plantilla</span>
              <span className={`text-sm font-bold ${
                selectedTemplate 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-500 dark:text-red-400'
              }`}>
                {selectedTemplate ? '✅ Seleccionada' : '❌ No Seleccionada'}
              </span>
            </div>
            {selectedTemplate && (
              <p className="text-xs text-gray-600 dark:text-gray-300">
                📋 {selectedTemplate.name}
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Número Válido</span>
              <span className={`text-sm font-bold ${
                isValidPhone 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-500 dark:text-red-400'
              }`}>
                {isValidPhone ? '✅ Válido' : '❌ Inválido'}
              </span>
            </div>
            {testNumber && (
              <p className="text-xs text-gray-600 dark:text-gray-300">
                📱 {testNumber}
              </p>
            )}
          </div>
        </div>

        {/* Result Section */}
        <div className="space-y-4">
          {testResult ? (
            <div className={`p-4 rounded-xl border ${
              testResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-semibold ${
                  testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                }`}>
                  {testResult.success ? 'Éxito' : 'Error'}
                </span>
              </div>
              <p className={`text-sm ${
                testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
              }`}>
                {testResult.message}
              </p>
              {!testResult.success && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Posibles Soluciones:</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Verifica que la plantilla esté <strong>APPROVED</strong> en Meta Business Manager</li>
                    <li>• Confirma que el nombre de la plantilla sea exacto</li>
                    <li>• Asegúrate de que tu número de WhatsApp Business esté verificado</li>
                    <li>• Revisa que el token tenga permisos de <strong>whatsapp_business_messaging</strong></li>
                  </ul>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                🕒 {testResult.timestamp.toLocaleTimeString()}
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm text-center">
              <Phone className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Los resultados de la prueba aparecerán aquí
              </p>
            </div>
          )}
          
          {/* Multimedia Template Warning */}
          {selectedTemplate && selectedTemplate.components?.some(comp => 
            comp.type === 'HEADER' && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(comp.format)
          ) && (
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">📷</span>
                </div>
                <span className="font-semibold text-purple-800 dark:text-purple-200">
                  Plantilla Multimedia Detectada
                </span>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Esta plantilla requiere parámetros multimedia (imagen/video/documento). 
                Se usará una imagen por defecto para la prueba.
              </p>
            </div>
          )}
          
          {/* Interactive Template Info */}
          {selectedTemplate && selectedTemplate.components?.some(comp => comp.type === 'BUTTONS') && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">🔘</span>
                </div>
                <span className="font-semibold text-green-800 dark:text-green-200">
                  Plantilla con Botones Interactivos
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Esta plantilla incluye botones que los usuarios pueden presionar. 
                Los botones se enviarán automáticamente con el mensaje.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Instrucciones:</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Selecciona una plantilla</strong> antes de enviar</li>
          <li>• <strong>Usa formato completo:</strong> 57 + número colombiano (ej: 573136298562)</li>
          <li>• <strong>Verifica que el número</strong> esté registrado en WhatsApp</li>
          <li>• <strong>La prueba usa la misma API</strong> que los envíos masivos</li>
          <li>• <strong>"Enviado exitosamente"</strong> significa que WhatsApp API aceptó el mensaje</li>
          <li>• <strong>La entrega real</strong> puede tomar unos segundos o minutos</li>
        </ul>
      </div>
      
      {/* Delivery Status Info */}
      <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800">
        <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">⚠️ Sobre la Entrega de Mensajes:</h4>
        <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
          <li>• <strong>API acepta mensaje</strong> ≠ <strong>Mensaje entregado</strong></li>
          <li>• WhatsApp puede <strong>rechazar mensajes</strong> por políticas internas</li>
          <li>• El número debe estar <strong>activo en WhatsApp</strong></li>
          <li>• Algunos números pueden tener <strong>restricciones</strong> de mensajes comerciales</li>
          <li>• La <strong>primera vez</strong> puede tomar más tiempo en llegar</li>
        </ul>
      </div>
    </div>
  );
};

export default TestMessagePanel;