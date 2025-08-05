import React from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { ConfiguredTemplate } from '../types';

interface SendingPanelProps {
  quantity: number;
  setQuantity: (quantity: number) => void;
  selectedTemplate: ConfiguredTemplate | null;
  selectedCount: number;
  onSendMessages: () => void;
  onSelectAll: () => void;
  isSending: boolean;
  sendingOrder: 'asc' | 'desc';
  setSendingOrder: (order: 'asc' | 'desc') => void;
  sortCriteria: 'ingreso' | 'medio_at';
  setSortCriteria: (criteria: 'ingreso' | 'medio_at') => void;
}

const SendingPanel: React.FC<SendingPanelProps> = ({
  quantity,
  setQuantity,
  selectedTemplate,
  selectedCount,
  onSendMessages,
  onSelectAll,
  isSending,
  sendingOrder,
  setSendingOrder,
  sortCriteria,
  setSortCriteria
}) => {
  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-700 dark:to-gray-600 p-6 rounded-2xl mb-6 border border-emerald-200 dark:border-gray-500 shadow-lg">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
          <Send className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🚀 Control de Envío de Mensajes</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Usuarios a Mostrar
            </label>
            <div className="relative">
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="block w-full rounded-xl border-gray-300 shadow-lg focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white py-3 px-4 text-sm appearance-none"
                disabled={isSending}
              >
                <option value={10}>10 usuarios</option>
                <option value={25}>25 usuarios</option>
                <option value={50}>50 usuarios</option>
                <option value={100}>100 usuarios</option>
                <option value={250}>250 usuarios</option>
                <option value={500}>500 usuarios</option>
                <option value={1000}>1,000 usuarios</option>
                <option value={2500}>2,500 usuarios</option>
                <option value={-1}>TODOS los usuarios</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              📊 Configuración de Ordenamiento
            </label>
            
            {/* Criterio de Ordenamiento */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Ordenar por:
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSortCriteria('medio_at')}
                  disabled={isSending}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${
                    sortCriteria === 'medio_at'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  💳 Fecha de Pago
                </button>
                <button
                  type="button"
                  onClick={() => setSortCriteria('ingreso')}
                  disabled={isSending}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${
                    sortCriteria === 'ingreso'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  📝 Fecha de Registro
                </button>
              </div>
            </div>
            
            {/* Dirección de Ordenamiento */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Dirección:
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSendingOrder('desc')}
                  disabled={isSending}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${
                    sendingOrder === 'desc'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  ⬇️ Más Recientes
                </button>
                <button
                  type="button"
                  onClick={() => setSendingOrder('asc')}
                  disabled={isSending}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${
                    sendingOrder === 'asc'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  ⬆️ Más Antiguos
                </button>
              </div>
            </div>
            
            {/* Descripción del Ordenamiento Actual */}
            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <span className="font-medium">🎯 Ordenando por:</span>{' '}
                {sortCriteria === 'medio_at' ? 'Fecha de Pago' : 'Fecha de Registro'}{' '}
                ({sendingOrder === 'desc' ? 'más recientes primero' : 'más antiguos primero'})
              </p>
            </div>
          </div>
          
          <button
            onClick={onSelectAll}
            className="w-full flex items-center justify-center px-6 py-3 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
            disabled={isSending}
          >
            <CheckCircle2 size={16} className="mr-2" />
            {selectedCount > 0 ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
          </button>
        </div>
        
        {/* Status Section */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Usuarios Seleccionados</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{selectedCount}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min((selectedCount / quantity) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado de Plantilla</span>
              <span className={`text-sm font-bold ${
                selectedTemplate 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-500 dark:text-red-400'
              }`}>
                {selectedTemplate ? 'Lista' : 'No Seleccionada'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Action Section */}
        <div className="space-y-4">
          <button
            onClick={onSendMessages}
            className={`w-full flex items-center justify-center px-6 py-4 text-lg font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform ${
              selectedTemplate && selectedCount > 0 && !isSending
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105 focus:ring-blue-500'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
            disabled={!selectedTemplate || selectedCount === 0 || isSending}
          >
            <Send size={20} className="mr-3" />
            {isSending 
              ? 'Enviando...' 
              : selectedTemplate && selectedCount > 0 
                ? `Enviar a ${selectedCount} Usuario${selectedCount !== 1 ? 's' : ''}` 
                : 'Configurar para Enviar'
            }
          </button>
        </div>
      </div>
      
      {(!selectedTemplate || selectedCount === 0) && !isSending && (
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">!</div>
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <span className="font-semibold">Acción Requerida:</span>
              {!selectedTemplate && ' Por favor selecciona una plantilla primero.'}
              {!selectedTemplate && selectedCount === 0 && ' También,'}
              {selectedCount === 0 && ' por favor selecciona al menos un usuario.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendingPanel;