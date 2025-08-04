import React, { useState } from 'react';
import { Plus, X, Filter, RotateCcw, Save, FolderOpen, Trash2, Star } from 'lucide-react';

interface FilterCondition {
  id: string;
  field: 'estado' | 'medio' | 'ingreso' | 'enviado';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: string | number | boolean;
  logicalOperator?: 'AND' | 'OR';
}

interface AdvancedFiltersProps {
  availableEstados: string[];
  availableMedios: string[];
  filters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
}

interface SavedFilter {
  id: string;
  name: string;
  description: string;
  filters: FilterCondition[];
  createdAt: Date;
  usageCount: number;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  availableEstados,
  availableMedios,
  filters,
  onFiltersChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    const saved = localStorage.getItem('whatsapp-saved-filters');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterDescription, setFilterDescription] = useState('');

  const fieldOptions = [
    { value: 'estado', label: 'Estado' },
    { value: 'medio', label: 'Método de Pago' },
    { value: 'ingreso', label: 'Ingreso' },
    { value: 'enviado', label: 'Enviado' }
  ];

  const operatorOptions = {
    estado: [
      { value: 'equals', label: 'es igual a' },
      { value: 'not_equals', label: 'no es igual a' },
      { value: 'contains', label: 'contiene' },
      { value: 'not_contains', label: 'no contiene' }
    ],
    medio: [
      { value: 'equals', label: 'es igual a' },
      { value: 'not_equals', label: 'no es igual a' },
      { value: 'contains', label: 'contiene' },
      { value: 'not_contains', label: 'no contiene' }
    ],
    ingreso: [
      { value: 'equals', label: 'es igual a' },
      { value: 'not_equals', label: 'no es igual a' },
      { value: 'greater_than', label: 'es mayor que' },
      { value: 'less_than', label: 'es menor que' }
    ],
    enviado: [
      { value: 'equals', label: 'es igual a' }
    ]
  };

  const addFilter = () => {
    const newFilter: FilterCondition = {
      id: Date.now().toString(),
      field: 'estado',
      operator: 'equals',
      value: '',
      logicalOperator: 'AND'
    };
    onFiltersChange([...filters, newFilter]);
  };

  const updateFilter = (id: string, updates: Partial<FilterCondition>) => {
    const updatedFilters = filters.map(filter => 
      filter.id === id ? { ...filter, ...updates } : filter
    );
    onFiltersChange(updatedFilters);
  };

  const removeFilter = (id: string) => {
    onFiltersChange(filters.filter(filter => filter.id !== id));
  };

  const clearAllFilters = () => {
    onFiltersChange([]);
  };

  const saveCurrentFilters = () => {
    if (filters.length === 0) return;
    
    if (!filterName.trim()) {
      alert('Por favor ingresa un nombre para el filtro');
      return;
    }
    
    const newSavedFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName.trim(),
      description: filterDescription.trim(),
      filters: [...filters],
      createdAt: new Date(),
      usageCount: 0
    };
    
    const updatedSavedFilters = [...savedFilters, newSavedFilter];
    setSavedFilters(updatedSavedFilters);
    localStorage.setItem('whatsapp-saved-filters', JSON.stringify(updatedSavedFilters));
    
    setFilterName('');
    setFilterDescription('');
    setShowSaveDialog(false);
    
    alert(`✅ Filtro "${newSavedFilter.name}" guardado exitosamente`);
  };

  const loadSavedFilter = (savedFilter: SavedFilter) => {
    // Update usage count
    const updatedSavedFilters = savedFilters.map(sf => 
      sf.id === savedFilter.id 
        ? { ...sf, usageCount: sf.usageCount + 1 }
        : sf
    );
    setSavedFilters(updatedSavedFilters);
    localStorage.setItem('whatsapp-saved-filters', JSON.stringify(updatedSavedFilters));
    
    // Load filters
    onFiltersChange(savedFilter.filters);
    setShowLoadDialog(false);
    setIsExpanded(true);
  };

  const deleteSavedFilter = (filterId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este filtro guardado?')) {
      const updatedSavedFilters = savedFilters.filter(sf => sf.id !== filterId);
      setSavedFilters(updatedSavedFilters);
      localStorage.setItem('whatsapp-saved-filters', JSON.stringify(updatedSavedFilters));
    }
  };

  const getValueOptions = (field: string) => {
    switch (field) {
      case 'estado':
        return availableEstados.map(estado => ({ value: estado, label: estado }));
      case 'medio':
        return availableMedios.map(medio => ({ value: medio, label: medio }));
      case 'enviado':
        return [
          { value: true, label: 'Sí' },
          { value: false, label: 'No' }
        ];
      default:
        return [];
    }
  };

  const renderValueInput = (filter: FilterCondition) => {
    const { field, operator, value } = filter;

    if (field === 'ingreso') {
      return (
        <input
          type="number"
          value={value as number || ''}
          onChange={(e) => updateFilter(filter.id, { value: Number(e.target.value) || 0 })}
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
          placeholder="Ingrese número..."
        />
      );
    }

    if (field === 'enviado') {
      return (
        <select
          value={value.toString()}
          onChange={(e) => updateFilter(filter.id, { value: e.target.value === 'true' })}
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
        >
          <option value="">Seleccionar...</option>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>
      );
    }

    const options = getValueOptions(field);
    
    if (operator === 'contains' || operator === 'not_contains') {
      return (
        <input
          type="text"
          value={value as string || ''}
          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
          placeholder="Ingrese texto..."
        />
      );
    }

    return (
      <select
        value={value as string || ''}
        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
      >
        <option value="">Seleccionar...</option>
        {options.map(option => (
          <option key={option.value.toString()} value={option.value.toString()}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl border border-purple-200 dark:border-gray-500 shadow-lg">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Filter className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              🔍 Filtros Avanzados
            </h3>
            {filters.length > 0 && (
              <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full text-xs font-medium">
                {filters.length} filtro{filters.length !== 1 ? 's' : ''} activo{filters.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {filters.length > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Limpiar Todo
              </button>
            )}
            
            {filters.length > 0 && (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center px-3 py-1 text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
              >
                <Save className="w-3 h-3 mr-1" />
                Guardar
              </button>
            )}
            
            {savedFilters.length > 0 && (
              <button
                onClick={() => setShowLoadDialog(true)}
                className="flex items-center px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                <FolderOpen className="w-3 h-3 mr-1" />
                Cargar ({savedFilters.length})
              </button>
            )}
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                isExpanded 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              {isExpanded ? 'Ocultar' : 'Mostrar'} Filtros
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-6 space-y-4">
            {filters.map((filter, index) => (
              <div key={filter.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-3">
                  {index > 0 && (
                    <div className="flex flex-col space-y-1">
                      <select
                        value={filter.logicalOperator || 'AND'}
                        onChange={(e) => updateFilter(filter.id, { logicalOperator: e.target.value as 'AND' | 'OR' })}
                        className="text-xs font-medium px-2 py-1 rounded border-0 focus:ring-1 focus:ring-blue-500"
                        style={{
                          backgroundColor: filter.logicalOperator === 'OR' ? '#fef3c7' : '#dbeafe',
                          color: filter.logicalOperator === 'OR' ? '#92400e' : '#1e40af'
                        }}
                      >
                        <option value="AND">Y</option>
                        <option value="OR">O</option>
                      </select>
                    </div>
                  )}
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Campo */}
                    <select
                      value={filter.field}
                      onChange={(e) => updateFilter(filter.id, { 
                        field: e.target.value as FilterCondition['field'],
                        operator: 'equals',
                        value: ''
                      })}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    >
                      {fieldOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {/* Operador */}
                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(filter.id, { 
                        operator: e.target.value as FilterCondition['operator'],
                        value: ''
                      })}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    >
                      {operatorOptions[filter.field]?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {/* Valor */}
                    <div className="md:col-span-1">
                      {renderValueInput(filter)}
                    </div>

                    {/* Botón eliminar */}
                    <button
                      onClick={() => removeFilter(filter.id)}
                      className="flex items-center justify-center w-full md:w-auto px-3 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addFilter}
              className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Agregar Filtro
            </button>

            {filters.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📋 Resumen de Filtros:</h4>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  {filters.map((filter, index) => (
                    <div key={filter.id}>
                      {index > 0 && (
                        <span 
                          className={`font-bold ${
                            filter.logicalOperator === 'OR' 
                              ? 'text-yellow-700 dark:text-yellow-300' 
                              : 'text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {filter.logicalOperator || 'Y'}{' '}
                        </span>
                      )}
                      <span className="font-medium">{fieldOptions.find(f => f.value === filter.field)?.label}</span>
                      {' '}
                      <span>{operatorOptions[filter.field]?.find(o => o.value === filter.operator)?.label}</span>
                      {' '}
                      <span className="font-medium">
                        {filter.field === 'enviado' 
                          ? (filter.value ? 'Sí' : 'No')
                          : filter.value.toString()
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Save className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Guardar Filtro</h2>
                </div>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Filtro *
                </label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Ej: Usuarios pendientes con ingreso alto"
                  maxLength={50}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={filterDescription}
                  onChange={(e) => setFilterDescription(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Describe para qué usas este filtro..."
                  rows={3}
                  maxLength={200}
                />
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <strong>Filtros a guardar:</strong>
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  {filters.map((filter, index) => (
                    <div key={filter.id}>
                      {index > 0 && (
                        <span className={`font-bold ${
                          filter.logicalOperator === 'OR' 
                            ? 'text-yellow-600' 
                            : 'text-blue-600'
                        }`}>
                          {filter.logicalOperator || 'Y'}{' '}
                        </span>
                      )}
                      <span>{fieldOptions.find(f => f.value === filter.field)?.label}</span>
                      {' '}
                      <span>{operatorOptions[filter.field]?.find(o => o.value === filter.operator)?.label}</span>
                      {' '}
                      <span className="font-medium">{filter.value.toString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-6 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveCurrentFilters}
                  disabled={!filterName.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Guardar Filtro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Filter Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FolderOpen className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Filtros Guardados</h2>
                </div>
                <button
                  onClick={() => setShowLoadDialog(false)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {savedFilters.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No hay filtros guardados
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Crea algunos filtros y guárdalos para reutilizarlos fácilmente.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedFilters
                    .sort((a, b) => b.usageCount - a.usageCount)
                    .map((savedFilter) => (
                    <div
                      key={savedFilter.id}
                      className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {savedFilter.name}
                            </h3>
                            {savedFilter.usageCount > 0 && (
                              <span className="flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                {savedFilter.usageCount}
                              </span>
                            )}
                          </div>
                          
                          {savedFilter.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                              {savedFilter.description}
                            </p>
                          )}
                          
                          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                            <p className="font-medium">Filtros ({savedFilter.filters.length}):</p>
                            {savedFilter.filters.map((filter, index) => (
                              <div key={filter.id} className="ml-2">
                                {index > 0 && (
                                  <span className={`font-bold ${
                                    filter.logicalOperator === 'OR' 
                                      ? 'text-yellow-600' 
                                      : 'text-blue-600'
                                  }`}>
                                    {filter.logicalOperator || 'Y'}{' '}
                                  </span>
                                )}
                                <span>{fieldOptions.find(f => f.value === filter.field)?.label}</span>
                                {' '}
                                <span>{operatorOptions[filter.field]?.find(o => o.value === filter.operator)?.label}</span>
                                {' '}
                                <span className="font-medium">{filter.value.toString()}</span>
                              </div>
                            ))}
                          </div>
                          
                          <p className="text-xs text-gray-400 mt-2">
                            Creado: {savedFilter.createdAt.toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => loadSavedFilter(savedFilter)}
                            className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                          >
                            <FolderOpen className="w-4 h-4 mr-1" />
                            Cargar
                          </button>
                          <button
                            onClick={() => deleteSavedFilter(savedFilter.id)}
                            className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;