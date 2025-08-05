import React, { useState } from 'react';
import { Check, ChevronRight, MessageSquare, Send, Users, Zap } from 'lucide-react';
import TemplateSelector from './TemplateSelector';
import TestMessageModal from './TestMessageModal';
import AdvancedFilters from './AdvancedFilters';
import SendingPanel from './SendingPanel';
import UserList from './UserList';
import { ConfiguredTemplate, User } from '../types';
import { Search, RefreshCw } from 'lucide-react';

interface FilterCondition {
  field: string;
  operator: string;
  value: string;
}

interface StepByStepSendingProps {
  // Database props (now managed in settings)
  selectedDatabases: string[];
  
  // Template props
  templates: ConfiguredTemplate[];
  selectedTemplate: ConfiguredTemplate | null;
  onSelectTemplate: (template: ConfiguredTemplate | null) => void;
  loading: boolean;
  
  // Users props
  filteredUsers: User[];
  selectedUsers: string[];
  onToggleSelection: (whatsapp: string) => void;
  onToggleSelectAll: () => void;
  allUsersSelected: boolean;
  
  // Search and filters
  searchTerm: string;
  onSearchChange: (term: string) => void;
  availableEstados: string[];
  availableMedios: string[];
  advancedFilters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  
  // Sending props
  quantity: number;
  setQuantity: (quantity: number) => void;
  onSendMessages: () => void;
  isSending: boolean;
  onRefresh: () => void;
  sendingOrder: 'asc' | 'desc';
  setSendingOrder: (order: 'asc' | 'desc') => void;
  sortBy: 'ingreso' | 'medio_at';
  setSortBy: (sortBy: 'ingreso' | 'medio_at') => void;
  
  // Pagination props
  pagination: any;
  loadingAll: boolean;
  users: User[];
  onLoadMore: () => void;
}

const StepByStepSending: React.FC<StepByStepSendingProps> = ({
  selectedDatabases,
  templates,
  selectedTemplate,
  onSelectTemplate,
  loading,
  filteredUsers,
  selectedUsers,
  onToggleSelection,
  onToggleSelectAll,
  allUsersSelected,
  searchTerm,
  onSearchChange,
  availableEstados,
  availableMedios,
  advancedFilters,
  onFiltersChange,
  quantity,
  setQuantity,
  onSendMessages,
  isSending,
  onRefresh,
  sendingOrder,
  setSendingOrder,
  sortBy,
  setSortBy,
  pagination,
  loadingAll,
  users,
  onLoadMore
}) => {
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  
  // Calculate step completion (simplified to 3 steps)
  const isStep1Complete = selectedTemplate !== null;
  const isStep2Complete = selectedUsers.length > 0;
  const canSend = isStep1Complete && isStep2Complete && selectedDatabases.length > 0;

  const StepIndicator = ({ stepNumber, title, isComplete, isActive, icon: Icon }: {
    stepNumber: number;
    title: string;
    isComplete: boolean;
    isActive: boolean;
    icon: any;
  }) => (
    <div className="flex items-center space-x-3">
      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
        isComplete 
          ? 'bg-green-500 border-green-500 text-white' 
          : isActive 
            ? 'bg-blue-500 border-blue-500 text-white' 
            : 'bg-gray-200 border-gray-300 text-gray-500'
      }`}>
        {isComplete ? <Check size={20} /> : <Icon size={20} />}
      </div>
      <div className={`transition-colors duration-300 ${
        isComplete ? 'text-green-600 dark:text-green-400' : 
        isActive ? 'text-blue-600 dark:text-blue-400' : 
        'text-gray-500 dark:text-gray-400'
      }`}>
        <p className="text-sm font-medium">Paso {stepNumber}</p>
        <p className="text-lg font-semibold">{title}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 border border-blue-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            🚀 Asistente de Envío Masivo
          </h1>
          <div className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className={`w-3 h-3 rounded-full ${canSend ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {canSend ? 'Listo para Enviar' : 'Completar Configuración'}
            </span>
          </div>
        </div>
        
        {/* Step Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StepIndicator
            stepNumber={1}
            title="Plantilla"
            isComplete={isStep1Complete}
            isActive={!isStep1Complete}
            icon={MessageSquare}
          />
          <StepIndicator
            stepNumber={2}
            title="Usuarios"
            isComplete={isStep2Complete}
            isActive={isStep1Complete && !isStep2Complete}
            icon={Users}
          />
          <StepIndicator
            stepNumber={3}
            title="Enviar"
            isComplete={false}
            isActive={canSend}
            icon={Send}
          />
        </div>
      </div>

      {/* Database Status Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 border border-blue-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                🗄️ Bases de Datos Configuradas
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedDatabases.length > 0 
                  ? `${selectedDatabases.length} base${selectedDatabases.length !== 1 ? 's' : ''} de datos activa${selectedDatabases.length !== 1 ? 's' : ''}: ${selectedDatabases.join(', ')}`
                  : 'No hay bases de datos configuradas'
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Para cambiar las bases de datos:</p>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">⚙️ Ve a Configuración</p>
          </div>
        </div>
      </div>

      {/* Step 1: Template Selection */}
      <div className={`transition-all duration-500 ${
        !isStep1Complete ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}>
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl p-8 border border-gray-200/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isStep1Complete 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}>
                {isStep1Complete ? <Check className="w-4 h-4 text-white" /> : <MessageSquare className="w-4 h-4 text-white" />}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                1. Elegir Plantilla de Mensaje
              </h2>
            </div>
            <div className="flex items-center space-x-3">
              {isStep1Complete && (
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <Check size={20} />
                  <span className="font-medium">Completado</span>
                </div>
              )}
              {isStep1Complete && (
                <button
                  onClick={() => setIsTestModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  <Zap size={16} />
                  <span>Enviar Prueba</span>
                </button>
              )}
            </div>
          </div>
          
          <TemplateSelector 
            templates={templates}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={onSelectTemplate}
            loading={loading}
          />
        </div>
      </div>



      {/* Step 2: User Selection */}
      <div className={`transition-all duration-500 ${
        isStep1Complete && !isStep2Complete ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      } ${!isStep1Complete ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl p-8 border border-gray-200/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isStep2Complete 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                  : isStep1Complete 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                    : 'bg-gray-400'
              }`}>
                {isStep2Complete ? <Check className="w-4 h-4 text-white" /> : <Users className="w-4 h-4 text-white" />}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                2. Seleccionar Usuarios ({filteredUsers.length})
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              {isStep2Complete && (
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <Check size={20} />
                  <span className="font-medium">{selectedUsers.length} seleccionados</span>
                </div>
              )}
              <button
                onClick={onRefresh}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col space-y-4 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-12 block w-full rounded-xl border-gray-300 shadow-lg focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white py-4 text-lg placeholder-gray-400 transition-all duration-200 hover:shadow-xl"
                placeholder="Buscar por número de WhatsApp..."
                value={searchTerm}
                onChange={e => onSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="mb-6">
            <AdvancedFilters
              availableEstados={availableEstados}
              availableMedios={availableMedios}
              filters={advancedFilters}
              onFiltersChange={onFiltersChange}
            />
          </div>

          <SendingPanel 
            quantity={quantity} 
            setQuantity={setQuantity}
            selectedTemplate={selectedTemplate}
            selectedCount={selectedUsers.length}
            onSendMessages={onSendMessages}
            onSelectAll={onToggleSelectAll}
            isSending={isSending}
            sendingOrder={sendingOrder}
            setSendingOrder={setSendingOrder}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />

          <UserList 
            users={filteredUsers}
            selectedUsers={selectedUsers}
            onToggleSelection={onToggleSelection}
            onToggleSelectAll={onToggleSelectAll}
            allUsersSelected={allUsersSelected}
          />
          
          {pagination?.hasMore && !loadingAll && quantity !== -1 && (
            <div className="mt-6 text-center">
              <button
                onClick={onLoadMore}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Cargando...' : `Cargar Más Usuarios (${pagination.total - users.length} restantes)`}
              </button>
            </div>
          )}
          
          {loadingAll && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center px-6 py-3 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span className="font-medium">Cargando TODOS los usuarios...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 3: Ready to Send */}
      {canSend && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 border-2 border-green-300 dark:border-green-700 shadow-xl">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Send className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-green-800 dark:text-green-300">
                ¡Todo Listo para Enviar!
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <p className="text-sm text-gray-600 dark:text-gray-400">Bases de Datos</p>
                <p className="font-semibold text-lg text-gray-900 dark:text-white">
                  {selectedDatabases.length} configurada{selectedDatabases.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedDatabases.join(', ')}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <p className="text-sm text-gray-600 dark:text-gray-400">Plantilla</p>
                <p className="font-semibold text-lg text-gray-900 dark:text-white">
                  {selectedTemplate?.displayName}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <p className="text-sm text-gray-600 dark:text-gray-400">Usuarios</p>
                <p className="font-semibold text-lg text-gray-900 dark:text-white">
                  {selectedUsers.length} destinatarios
                </p>
              </div>
            </div>
            
            <button
              onClick={onSendMessages}
              disabled={isSending}
              className="inline-flex items-center px-8 py-4 text-xl font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={24} className="mr-3" />
              {isSending ? 'Enviando...' : `🚀 Enviar a ${selectedUsers.length} Usuarios`}
            </button>
          </div>
        </div>
      )}

      {/* Test Message Modal */}
      <TestMessageModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        selectedTemplate={selectedTemplate}
        selectedDatabases={selectedDatabases}
      />
    </div>
  );
};

export default StepByStepSending;