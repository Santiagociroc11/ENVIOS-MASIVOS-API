import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, RefreshCw, Filter, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import DatabaseSelector from './components/DatabaseSelector';
import TemplateSelector from './components/TemplateSelector';
import UserList from './components/UserList';
import SendingPanel from './components/SendingPanel';
import SendingModal from './components/SendingModal';
import { fetchTemplates, fetchFilteredUsers, sendTemplateMessage, markMessageSent } from './api/services';
import { Template, User } from './types';

interface SendingResult {
  phoneNumber: string;
  success: boolean;
  error?: string;
  timestamp: number;
}

function App() {
  const [selectedDatabase, setSelectedDatabase] = useState<string>('bot-win-2');
  const [databaseInfo, setDatabaseInfo] = useState<any>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(10);
  const [sendingOrder, setSendingOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sentCount, setSentCount] = useState<number>(0);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filter, setFilter] = useState({
    status: 'all',
    paymentMethod: 'all'
  });

  // Modal states
  const [showSendingModal, setShowSendingModal] = useState<boolean>(false);
  const [sendingResults, setSendingResults] = useState<SendingResult[]>([]);
  const [currentSendingIndex, setCurrentSendingIndex] = useState<number>(0);
  const [successCount, setSuccessCount] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [sendingSpeed, setSendingSpeed] = useState<number>(1000); // Default: Normal speed
  const [shouldCancel, setShouldCancel] = useState<boolean>(false);
  
  // Ref to control the sending process
  const sendingControlRef = useRef<{ cancel: boolean; pause: boolean }>({ cancel: false, pause: false });

  // Fetch templates and users on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const templatesData = await fetchTemplates();
        setTemplates(templatesData);
        
        if (selectedDatabase) {
          const response = await fetchFilteredUsers(selectedDatabase);
          setUsers(response.users);
          setFilteredUsers(response.users);
          setDatabaseInfo({
            name: response.database,
            collection: response.collection,
            count: response.count
          });
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [selectedDatabase]);

  // Filter users based on search term and filters
  useEffect(() => {
    let filtered = [...users];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.whatsapp.includes(searchTerm)
      );
    }
    
    // Apply status filter
    if (filter.status !== 'all') {
      filtered = filtered.filter(user => user.estado === filter.status);
    }
    
    // Apply payment method filter
    if (filter.paymentMethod !== 'all') {
      filtered = filtered.filter(user => user.medio === filter.paymentMethod);
    }
    
    // Apply order
    filtered = filtered.sort((a, b) => {
      const timeA = a.medio_at || 0;
      const timeB = b.medio_at || 0;
      
      return sendingOrder === 'asc' 
        ? timeA - timeB 
        : timeB - timeA;
    });
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, filter, sendingOrder]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (selectedDatabase) {
        const response = await fetchFilteredUsers(selectedDatabase);
        setUsers(response.users);
        setFilteredUsers(response.users);
        setDatabaseInfo({
          name: response.database,
          collection: response.collection,
          count: response.count
        });
      }
    } catch (error) {
      console.error('Error refreshing users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.slice(0, quantity).length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.slice(0, quantity).map(user => user.whatsapp));
    }
  };

  const toggleUserSelection = (whatsapp: string) => {
    setSelectedUsers(prev => 
      prev.includes(whatsapp) 
        ? prev.filter(id => id !== whatsapp) 
        : [...prev, whatsapp]
    );
  };

  const getSpeedDelay = (speed: number): number => {
    const speedMap: { [key: number]: number } = {
      500: 2000,   // Lento: 2 segundos
      1000: 1000,  // Normal: 1 segundo
      1500: 500,   // Rápido: 0.5 segundos
      2000: 200    // Muy rápido: 0.2 segundos
    };
    return speedMap[speed] || 1000;
  };

  const resetSendingState = () => {
    setSendingResults([]);
    setCurrentSendingIndex(0);
    setSuccessCount(0);
    setErrorCount(0);
    setIsPaused(false);
    setIsCompleted(false);
    setShouldCancel(false);
    sendingControlRef.current = { cancel: false, pause: false };
  };

  const handleSendMessages = async () => {
    if (!selectedTemplate || selectedUsers.length === 0) return;
    
    // Reset and initialize sending state
    resetSendingState();
    setIsSending(true);
    setShowSendingModal(true);
    
    const usersToMessage = filteredUsers.filter(user => 
      selectedUsers.includes(user.whatsapp)
    );
    
    let localSuccessCount = 0;
    let localErrorCount = 0;
    const localResults: SendingResult[] = [];
    
    for (let i = 0; i < usersToMessage.length; i++) {
      // Check for cancellation
      if (sendingControlRef.current.cancel) {
        break;
      }
      
      // Check for pause
      while (sendingControlRef.current.pause && !sendingControlRef.current.cancel) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (sendingControlRef.current.cancel) {
        break;
      }
      
      const user = usersToMessage[i];
      setCurrentSendingIndex(i + 1);
      
      try {
        const result = await sendTemplateMessage(user.whatsapp, selectedTemplate.name, selectedDatabase);
        
        const sendingResult: SendingResult = {
          phoneNumber: user.whatsapp,
          success: result.success,
          error: result.error,
          timestamp: Date.now()
        };
        
        localResults.push(sendingResult);
        setSendingResults([...localResults]);
        
        if (result.success) {
          localSuccessCount++;
          setSuccessCount(localSuccessCount);
          // Mark as sent in the database
          await markMessageSent(user.whatsapp, selectedDatabase);
        } else {
          localErrorCount++;
          setErrorCount(localErrorCount);
        }
        
      } catch (error) {
        const sendingResult: SendingResult = {
          phoneNumber: user.whatsapp,
          success: false,
          error: 'Error de conexión',
          timestamp: Date.now()
        };
        
        localResults.push(sendingResult);
        setSendingResults([...localResults]);
        localErrorCount++;
        setErrorCount(localErrorCount);
      }
      
      // Wait according to speed setting (except for the last message)
      if (i < usersToMessage.length - 1) {
        await new Promise(resolve => setTimeout(resolve, getSpeedDelay(sendingSpeed)));
      }
    }
    
    setIsSending(false);
    setIsCompleted(true);
    
    // Refresh the user list after sending
    setTimeout(() => {
      handleRefresh();
    }, 1000);
  };

  const handlePauseSending = () => {
    setIsPaused(true);
    sendingControlRef.current.pause = true;
  };

  const handleResumeSending = () => {
    setIsPaused(false);
    sendingControlRef.current.pause = false;
  };

  const handleCancelSending = () => {
    setShouldCancel(true);
    sendingControlRef.current.cancel = true;
    setIsSending(false);
    setIsCompleted(true);
  };

  const handleCloseModal = () => {
    setShowSendingModal(false);
    resetSendingState();
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSendingSpeed(newSpeed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg border-b border-gray-200/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Send className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                Mensajería de Plantillas WhatsApp
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
                🚀 Envía mensajes personalizados a usuarios que solicitaron pago pero no completaron su compra
                {databaseInfo && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-xs font-medium">
                    📊 {databaseInfo.name} ({databaseInfo.count} usuarios)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl p-8 mb-8 border border-gray-200/20">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">🗄️ Selección de Base de Datos</h2>
          </div>
          
          <DatabaseSelector 
            selectedDatabase={selectedDatabase}
            onSelectDatabase={setSelectedDatabase}
            onDatabaseChange={setDatabaseInfo}
          />
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl p-8 mb-8 border border-gray-200/20">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">📋 Selección de Plantilla</h2>
          </div>
          
          <TemplateSelector 
            templates={templates}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
            loading={loading}
          />
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl p-8 border border-gray-200/20">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                👥 Usuarios ({filteredUsers.length})
              </h2>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar Datos
            </button>
          </div>

          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-12 block w-full rounded-xl border-gray-300 shadow-lg focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white py-4 text-lg placeholder-gray-400 transition-all duration-200 hover:shadow-xl"
                placeholder="🔍 Buscar por número de WhatsApp..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-6 py-4 text-sm font-medium rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                showFilters 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-purple-500/25' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600'
              }`}
            >
              <Filter size={16} className="mr-2" />
              Filtros Avanzados
              {showFilters ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
            </button>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 p-6 rounded-2xl mb-6 border border-purple-200 dark:border-gray-500 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Filter className="w-3 h-3 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🎛️ Filtros Avanzados</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    📊 Filtro de Estado
                  </label>
                  <div className="relative">
                    <select
                      value={filter.status}
                      onChange={(e) => setFilter({...filter, status: e.target.value})}
                      className="block w-full rounded-xl border-gray-300 shadow-lg focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white py-3 px-4 text-sm appearance-none"
                    >
                      <option value="all">✨ Todos los Estados</option>
                      <option value="medio-enviado">📤 Medio Enviado</option>
                      <option value="nequi">💜 Nequi</option>
                      <option value="bancolombia">🔵 Bancolombia</option>
                      <option value="daviplata">🟡 Daviplata</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    💳 Método de Pago
                  </label>
                  <div className="relative">
                    <select
                      value={filter.paymentMethod}
                      onChange={(e) => setFilter({...filter, paymentMethod: e.target.value})}
                      className="block w-full rounded-xl border-gray-300 shadow-lg focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white py-3 px-4 text-sm appearance-none"
                    >
                      <option value="all">🌟 Todos los Métodos</option>
                      <option value="nequi">💜 Nequi</option>
                      <option value="bancolombia">🔵 Bancolombia</option>
                      <option value="daviplata">🟡 Daviplata</option>
                      <option value="transfiya">🟢 Transfiya</option>
                      <option value="efectivo">💵 Efectivo</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    ⏰ Orden de Envío
                  </label>
                  <div className="relative">
                    <select
                      value={sendingOrder}
                      onChange={(e) => setSendingOrder(e.target.value as 'asc' | 'desc')}
                      className="block w-full rounded-xl border-gray-300 shadow-lg focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white py-3 px-4 text-sm appearance-none"
                    >
                      <option value="desc">🔽 Más Recientes Primero</option>
                      <option value="asc">🔼 Más Antiguos Primero</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <SendingPanel 
            quantity={quantity} 
            setQuantity={setQuantity}
            selectedTemplate={selectedTemplate}
            selectedCount={selectedUsers.length}
            onSendMessages={handleSendMessages}
            onSelectAll={handleSelectAll}
            isSending={isSending}
          />

          <UserList 
            users={filteredUsers.slice(0, quantity)}
            selectedUsers={selectedUsers}
            onToggleSelection={toggleUserSelection}
          />
        </div>
      </main>

      {/* Sending Modal */}
      <SendingModal
        isOpen={showSendingModal}
        onClose={handleCloseModal}
        totalUsers={selectedUsers.length}
        currentIndex={currentSendingIndex}
        successCount={successCount}
        errorCount={errorCount}
        results={sendingResults}
        isCompleted={isCompleted}
        isPaused={isPaused}
        onPause={handlePauseSending}
        onResume={handleResumeSending}
        onCancel={handleCancelSending}
        sendingSpeed={sendingSpeed}
        onSpeedChange={handleSpeedChange}
        templateName={selectedTemplate?.name || ''}
      />
    </div>
  );
}

export default App;