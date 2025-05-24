import React from 'react';
import { X, Send, CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react';

interface SendingResult {
  phoneNumber: string;
  success: boolean;
  error?: string;
  timestamp: number;
}

interface SendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalUsers: number;
  currentIndex: number;
  successCount: number;
  errorCount: number;
  results: SendingResult[];
  isCompleted: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  sendingSpeed: number;
  onSpeedChange: (speed: number) => void;
  templateName: string;
}

const SendingModal: React.FC<SendingModalProps> = ({
  isOpen,
  onClose,
  totalUsers,
  currentIndex,
  successCount,
  errorCount,
  results,
  isCompleted,
  isPaused,
  onPause,
  onResume,
  onCancel,
  sendingSpeed,
  onSpeedChange,
  templateName
}) => {
  if (!isOpen) return null;

  const progress = totalUsers > 0 ? (currentIndex / totalUsers) * 100 : 0;
  const speedOptions = [
    { value: 500, label: '🐌 Lento (2 seg)', delay: 2000 },
    { value: 1000, label: '🚶 Normal (1 seg)', delay: 1000 },
    { value: 1500, label: '🏃 Rápido (0.5 seg)', delay: 500 },
    { value: 2000, label: '⚡ Muy Rápido (0.2 seg)', delay: 200 }
  ];

  const getSpeedLabel = () => {
    const option = speedOptions.find(opt => opt.value === sendingSpeed);
    return option?.label || '🚶 Normal';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">📤 Enviando Mensajes</h2>
                <p className="text-blue-100 text-sm">Plantilla: {templateName}</p>
              </div>
            </div>
            {isCompleted && (
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalUsers}</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Exitosos</span>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{successCount}</p>
            </div>
            
            <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-xl">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Errores</span>
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{errorCount}</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Progreso</span>
              </div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{Math.round(progress)}%</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
              <span>Progreso del Envío</span>
              <span>{currentIndex} / {totalUsers}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                {!isCompleted && !isPaused && (
                  <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                )}
              </div>
            </div>
          </div>

          {/* Speed Control */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Velocidad de Envío:</span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{getSpeedLabel()}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {speedOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onSpeedChange(option.value)}
                  disabled={isCompleted}
                  className={`px-3 py-1 text-xs rounded-lg transition-all ${
                    sendingSpeed === option.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Control Buttons */}
          {!isCompleted && (
            <div className="flex items-center space-x-3">
              {isPaused ? (
                <button
                  onClick={onResume}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Reanudar
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Pausar
                </button>
              )}
              
              <button
                onClick={onCancel}
                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📋 Resultados Detallados</h3>
          
          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Send className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Los resultados aparecerán aquí conforme se envíen los mensajes...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {result.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {result.phoneNumber}
                      </p>
                                                                  {result.error && (                        <div className="text-sm text-red-600 dark:text-red-400 mt-1">                          <p className="font-medium">Error:</p>                          <p className="break-words">{result.error}</p>                        </div>                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {isCompleted && (
          <div className="bg-gray-50 dark:bg-gray-900 p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  ¡Envío Completado!
                </span>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendingModal; 