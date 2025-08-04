import React, { useState } from 'react';
import { Plus, X, Filter, RotateCcw } from 'lucide-react';

interface FilterCondition {
  id: string;
  field: 'estado' | 'medio' | 'ingreso' | 'enviado';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: string | number | boolean;
}

interface AdvancedFiltersProps {
  availableEstados: string[];
  availableMedios: string[];
  filters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  availableEstados,
  availableMedios,
  filters,
  onFiltersChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
      value: ''
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
                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">
                      Y
                    </div>
                  )}
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
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
                      {index > 0 && <span className="font-bold">Y </span>}
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
    </div>
  );
};

export default AdvancedFilters;