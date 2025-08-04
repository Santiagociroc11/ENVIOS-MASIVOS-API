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
  selectedDatabases: string[];
  onSelectDatabases: (dbKeys: string[]) => void;
  onDatabaseChange?: (dbInfo: DatabaseInfo) => void;
}

const DatabaseSelector: React.FC<DatabaseSelectorProps> = ({
  selectedDatabases,
  onSelectDatabases,
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

  const handleToggleDatabase = (dbKey: string) => {
    const newSelection = selectedDatabases.includes(dbKey)
      ? selectedDatabases.filter(key => key !== dbKey)
      : [...selectedDatabases, dbKey];
    
    onSelectDatabases(newSelection);
    
    // Notify about the change with combined info
    if (onDatabaseChange && newSelection.length > 0) {
      const selectedDbInfos = databases.filter(db => newSelection.includes(db.key));
      const combinedInfo = {
        key: newSelection.join(','),
        name: newSelection.length === 1 
          ? selectedDbInfos[0]?.name 
          : `${newSelection.length} bases de datos seleccionadas`,
        description: newSelection.length === 1
          ? selectedDbInfos[0]?.description
          : `Combinando datos de: ${selectedDbInfos.map(db => db.name).join(', ')}`,
        collection: selectedDbInfos.map(db => db.collection).join(', '),
        userCount: 'Calculando...'
      };
      onDatabaseChange(combinedInfo);
    }
  };

  const handleSelectAll = () => {
    const allKeys = databases.map(db => db.key);
    const isAllSelected = allKeys.every(key => selectedDatabases.includes(key));
    
    if (isAllSelected) {
      onSelectDatabases([]);
    } else {
      onSelectDatabases(allKeys);
    }
  };

  const testAllConnections = async () => {
    for (const db of databases) {
      await testConnection(db.key);
    }
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
          🗄️ Seleccionar Bases de Datos (Múltiple)
        </label>
        
        <div className="flex gap-3 mb-4">
          <button
            onClick={handleSelectAll}
            className="flex items-center px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Database className="w-4 h-4 mr-2" />
            {databases.every(db => selectedDatabases.includes(db.key)) ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
          </button>
          
          <button
            onClick={testAllConnections}
            disabled={testing !== null}
            className="flex items-center px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            Probar Todas
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {databases.map((db) => (
            <div
              key={db.key}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedDatabases.includes(db.key)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-300'
              }`}
              onClick={() => handleToggleDatabase(db.key)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedDatabases.includes(db.key)}
                    onChange={() => handleToggleDatabase(db.key)}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{db.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{db.userCount} usuarios</p>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    testConnection(db.key);
                  }}
                  disabled={testing === db.key}
                  className="flex items-center px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${testing === db.key ? 'animate-spin' : ''}`} />
                  Test
                </button>
              </div>
              
              {/* Test Results */}
              {testResults[db.key] && (
                <div className="mt-3 p-2 rounded-lg border text-xs">
                  {testResults[db.key].success ? (
                    <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>✅ Conectado ({testResults[db.key].count} usuarios)</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
                      <AlertCircle className="w-4 h-4" />
                      <span>❌ Error: {testResults[db.key].error}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedDatabases.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 p-6 rounded-2xl border border-blue-200 dark:border-gray-500 shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              🗄️ {selectedDatabases.length === 1 ? 'Base de Datos Seleccionada' : `${selectedDatabases.length} Bases de Datos Seleccionadas`}
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">📝 Bases Seleccionadas</span>
              <div className="mt-2 space-y-1">
                {selectedDatabases.map(dbKey => {
                  const db = databases.find(d => d.key === dbKey);
                  return (
                    <div key={dbKey} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">{db?.name}</span>
                      <span className="text-gray-500 dark:text-gray-400">{db?.userCount}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">📊 Resumen</span>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Total de BDs:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedDatabases.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Estado:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {selectedDatabases.length === 1 ? 'Individual' : 'Combinado'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseSelector;