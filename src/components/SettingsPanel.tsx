import React from 'react';
import { Settings, Database, Save, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import DatabaseSelector from './DatabaseSelector';

interface SettingsPanelProps {
  selectedDatabases: string[];
  onSelectDatabases: (databases: string[]) => void;
  onDatabaseChange: (info: any) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  selectedDatabases,
  onSelectDatabases,
  onDatabaseChange
}) => {
  const handleResetToDefault = () => {
          onSelectDatabases(['bot-win-4']); // Solo BD4 existe
  };

  const handleSelectAll = () => {
          onSelectDatabases(['bot-win-4']); // Solo BD4 existe
  };

  const handleDeselectAll = () => {
    onSelectDatabases([]);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 border border-orange-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                ⚙️ Configuración del Sistema
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Gestiona las configuraciones globales de la aplicación
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedDatabases.length} BD{selectedDatabases.length !== 1 ? 's' : ''} Activa{selectedDatabases.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Database Configuration */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl p-8 border border-gray-200/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                🗄️ Configuración de Bases de Datos
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selecciona las bases de datos que se usarán para los envíos masivos
              </p>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 rounded-lg transition-colors"
            >
              ✅ Todas
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-3 py-2 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 rounded-lg transition-colors"
            >
              ❌ Ninguna
            </button>
            <button
              onClick={handleResetToDefault}
              className="flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <RotateCcw size={14} className="mr-1" />
              Reset
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                💡 Configuración Global de Bases de Datos
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Las bases de datos seleccionadas aquí se aplicarán automáticamente a todos los envíos. 
                Ya no necesitas seleccionarlas cada vez que vayas a enviar mensajes.
              </p>
            </div>
          </div>
        </div>

        {/* Database Selector */}
        <DatabaseSelector 
          selectedDatabases={selectedDatabases}
          onSelectDatabases={onSelectDatabases}
          onDatabaseChange={onDatabaseChange}
        />

        {/* Current Selection Summary */}
        <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                📊 Resumen de Configuración Actual
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedDatabases.length > 0 
                  ? `${selectedDatabases.length} base${selectedDatabases.length !== 1 ? 's' : ''} de datos seleccionada${selectedDatabases.length !== 1 ? 's' : ''} para los envíos`
                  : 'No hay bases de datos seleccionadas - Los envíos estarán deshabilitados'
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {selectedDatabases.length > 0 ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                selectedDatabases.length > 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {selectedDatabases.length > 0 ? 'Configurado' : 'Sin Configurar'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* API Configuration Section (Future) */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl p-8 border border-gray-200/20 opacity-60">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            🔧 Configuración de API (Próximamente)
          </h2>
        </div>
        
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Settings className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Configuraciones Avanzadas</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Próximamente: Configuración de tokens de WhatsApp Business API, límites de envío, 
            plantillas personalizadas y más opciones avanzadas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;