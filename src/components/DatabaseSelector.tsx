import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface DatabaseInfo {
  key: string;
  name: string;
  description: string;
  collection: string;
  userCount: string;
}

interface DatabaseSelectorProps {
  selectedDatabase: string;
  onSelectDatabase: (dbKey: string) => void;
  onDatabaseChange?: (dbInfo: DatabaseInfo) => void;
}

const DatabaseSelector: React.FC<DatabaseSelectorProps> = ({
  selectedDatabase,
  onSelectDatabase,
  onDatabaseChange
}) => {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ [key: string]: { success: boolean; count?: number; error?: string } }>({});

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/databases');
      const data = await response.json();
      setDatabases(data);
    } catch (error) {
      console.error('Error fetching databases:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (dbKey: string) => {
    try {
      setTesting(dbKey);
      const response = await fetch(`/api/databases/test/${dbKey}`, {
        method: 'POST'
      });
      const result = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [dbKey]: {
          success: result.success,
          count: result.userCount,
          error: result.error
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [dbKey]: {
          success: false,
          error: 'Connection failed'
        }
      }));
    } finally {
      setTesting(null);
    }
  };

  const handleSelectDatabase = (dbKey: string) => {
    onSelectDatabase(dbKey);
    const dbInfo = databases.find(db => db.key === dbKey);
    if (dbInfo && onDatabaseChange) {
      onDatabaseChange(dbInfo);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl w-full"></div>
        <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          🗄️ Seleccionar Base de Datos
        </label>
        <div className="relative">
          <select
            className="block w-full rounded-xl border-gray-300 shadow-lg focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg py-4 pl-4 pr-10 transition-all duration-200 hover:shadow-xl"
            value={selectedDatabase}
            onChange={(e) => handleSelectDatabase(e.target.value)}
          >
            <option value="">🔍 Selecciona una base de datos</option>
            {databases.map((db) => (
              <option key={db.key} value={db.key}>
                📊 {db.name} ({db.userCount} usuarios)
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Database className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {selectedDatabase && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 p-6 rounded-2xl border border-blue-200 dark:border-gray-500 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Database className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🗄️ Información de la Base de Datos</h3>
            </div>
            <button
              onClick={() => testConnection(selectedDatabase)}
              disabled={testing === selectedDatabase}
              className="flex items-center px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${testing === selectedDatabase ? 'animate-spin' : ''}`} />
              {testing === selectedDatabase ? 'Probando...' : 'Probar Conexión'}
            </button>
          </div>
          
          {databases.filter(db => db.key === selectedDatabase).map(db => (
            <div key={db.key} className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">📝 Nombre</span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{db.name}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">📄 Descripción</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{db.description}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">🗂️ Colección</span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{db.collection}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">👥 Usuarios</span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                    {testResults[db.key]?.count !== undefined ? testResults[db.key].count : db.userCount}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Test Results */}
          {testResults[selectedDatabase] && (
            <div className="mt-4 p-4 rounded-xl border">
              {testResults[selectedDatabase].success ? (
                <div className="flex items-center space-x-2 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">✅ Conexión exitosa</span>
                  {testResults[selectedDatabase].count !== undefined && (
                    <span className="text-sm">({testResults[selectedDatabase].count} usuarios encontrados)</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <span className="font-medium">❌ Error de conexión</span>
                    {testResults[selectedDatabase].error && (
                      <p className="text-sm mt-1">{testResults[selectedDatabase].error}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabaseSelector;