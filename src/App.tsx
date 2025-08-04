import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, RefreshCw, Database, MessageSquare, Users, History, Settings } from 'lucide-react';
import DatabaseSelector from './components/DatabaseSelector';
import TemplateSelector from './components/TemplateSelector';
import UserList from './components/UserList';
import SendingPanel from './components/SendingPanel';
import SendingModal from './components/SendingModal';
import CampaignHistory from './components/CampaignHistory';
import AdvancedFilters from './components/AdvancedFilters';
import TestMessagePanel from './components/TestMessagePanel';
import { fetchTemplates, fetchFilteredUsers, sendTemplateMessage, markMessageSent, fetchEstados, fetchMedios, createCampaign, addUserToCampaign, completeCampaign } from './api/services';
import { Template, User } from './types';

interface SendingResult {
  phoneNumber: string;
  success: boolean;
  error?: string;
  timestamp: number;
}

interface FilterCondition {
  id: string;
  field: 'estado' | 'medio' | 'ingreso' | 'enviado';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: string | number | boolean;
}

type TabType = 'send' | 'campaigns' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('send');
  const [selectedDatabases, setSelectedDatabases] = useState<string[]>(['bot-win', 'bot-win-2', 'bot-win-3', 'bot-win-4']);
  const [databaseInfo, setDatabaseInfo] = useState<any>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(100);
  const [loadingAll, setLoadingAll] = useState<boolean>(false);
  const [sendingOrder, setSendingOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sentCount, setSentCount] = useState<number>(0);
  const [availableEstados, setAvailableEstados] = useState<string[]>([]);
  const [availableMedios, setAvailableMedios] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<any>(null);
  const [advancedFilters, setAdvancedFilters] = useState<FilterCondition[]>([]);

  // Modal states
  const [showSendingModal, setShowSendingModal] = useState<boolean>(false);
  const [sendingResults, setSendingResults] = useState<SendingResult[]>([]);
  const [currentSendingIndex, setCurrentSendingIndex] = useState<number>(0);
  const [successCount, setSuccessCount] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [sendingSpeed, setSendingSpeed] = useState<number>(1000);
  const [shouldCancel, setShouldCancel] = useState<boolean>(false);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null);
  
  const sendingControlRef = useRef<{ cancel: boolean; pause: boolean }>({ cancel: false, pause: false });

  // Fetch templates and users on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const shouldLoadAll = quantity === -1;
      setLoadingAll(shouldLoadAll);
      
      try {
        const templatesData = await fetchTemplates();
        setTemplates(templatesData);
        
        if (selectedDatabases.length > 0) {
          const response = await fetchFilteredUsers(selectedDatabases, 1, quantity, shouldLoadAll);
          setUsers(response.users);
          setFilteredUsers(response.users);
          setPagination(response.pagination);
          setDatabaseInfo({
            name: response.database,
            collection: response.collection,
            count: response.count
          });
          
          const estadosData = await fetchEstados(selectedDatabases);
          const mediosData = await fetchMedios(selectedDatabases);
          setAvailableEstados(estadosData);
          setAvailableMedios(mediosData);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
        setLoadingAll(false);
      }
    };

    loadInitialData();
  }, [selectedDatabases, currentPage, quantity]);

  // Filter users based on search term and filters
  useEffect(() => {
    let filtered = [...users];
    
    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.whatsapp.includes(searchTerm)
      );
    }
    
    // Apply advanced filters with AND/OR logic
    if (advancedFilters.length > 0) {
      filtered = filtered.filter(user => {
        let result = true;
        let currentGroup: FilterCondition[] = [];
        
        // Group filters by logical operator
        for (let i = 0; i < advancedFilters.length; i++) {
          const filter = advancedFilters[i];
          
          if (i === 0 || filter.logicalOperator === 'AND') {
            // Process previous OR group if exists
            if (currentGroup.length > 0) {
              const orResult = currentGroup.some(f => evaluateFilter(user, f));
              result = result && orResult;
              currentGroup = [];
            }
            
            if (filter.logicalOperator === 'AND' || i === 0) {
              result = result && evaluateFilter(user, filter);
            } else {
              currentGroup.push(filter);
            }
          } else {
            // OR operator
            currentGroup.push(filter);
          }
        }
        
        // Process final OR group if exists
        if (currentGroup.length > 0) {
          const orResult = currentGroup.some(f => evaluateFilter(user, f));
          result = result && orResult;
        }
        
        return result;
      });
    }
    
    // Apply sorting
    filtered = filtered.sort((a, b) => {
      const timeA = a.medio_at || 0;
      const timeB = b.medio_at || 0;
      
      return sendingOrder === 'asc' 
        ? timeA - timeB 
        : timeB - timeA;
    });
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, advancedFilters, sendingOrder]);

  // Helper function to evaluate individual filter
  const evaluateFilter = (user: User, filter: FilterCondition): boolean => {
    const fieldValue = user[filter.field];
    const filterValue = filter.value;
    
    switch (filter.operator) {
      case 'equals':
        return fieldValue === filterValue;
      case 'not_equals':
        return fieldValue !== filterValue;
      case 'greater_than':
        return Number(fieldValue) > Number(filterValue);
      case 'less_than':
        return Number(fieldValue) < Number(filterValue);
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
      default:
        return true;
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    const shouldLoadAll = quantity === -1;
    setLoadingAll(shouldLoadAll);
    
    try {
      if (selectedDatabases.length > 0) {
        const response = await fetchFilteredUsers(selectedDatabases, 1, quantity, shouldLoadAll);
        setUsers(response.users);
        setFilteredUsers(response.users);
        setPagination(response.pagination);
        setDatabaseInfo({
          name: response.database,
          collection: response.collection,
          count: response.count
        });
        
        const estadosData = await fetchEstados(selectedDatabases);
        const mediosData = await fetchMedios(selectedDatabases);
        setAvailableEstados(estadosData);
        setAvailableMedios(mediosData);
      }
    } catch (error) {
      console.error('Error refreshing users:', error);
    } finally {
      setLoading(false);
      setLoadingAll(false);
    }
  };

  // Log all templates when loaded
  React.useEffect(() => {
    if (templates.length > 0) {
      console.log('📋 Todas las Plantillas Cargadas:', templates);
      console.log('📊 Total de Plantillas:', templates.length);
      templates.forEach((template, index) => {
        console.log(`📱 Plantilla ${index + 1}:`, {
          name: template.name,
          status: template.status,
          category: template.category,
          language: template.language,
          components: template.components?.length || 0
        });
      });
    }
  }, [templates]);

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
      500: 2000,
      1000: 1000,
      1500: 500,
      2000: 200
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
    
    // Create campaign first
    const campaignName = `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`;
    const campaign = await createCampaign(
      campaignName,
      selectedTemplate.name,
      selectedTemplate.language,
      selectedDatabases
    );
    
    if (!campaign) {
      console.error('Failed to create campaign');
      return;
    }
    
    setCurrentCampaignId(campaign.campaignId);
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
      if (sendingControlRef.current.cancel) {
        break;
      }
      
      while (sendingControlRef.current.pause && !sendingControlRef.current.cancel) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (sendingControlRef.current.cancel) {
        break;
      }
      
      const user = usersToMessage[i];
      setCurrentSendingIndex(i + 1);
      
      try {
        const result = await sendTemplateMessage(user.whatsapp, selectedTemplate.name, selectedDatabases);
        
        // Add user to campaign
        if (currentCampaignId) {
          await addUserToCampaign(
            currentCampaignId,
            user.whatsapp,
            user._sourceDatabase || selectedDatabases[0],
            result.success ? 'sent' : 'failed',
            result.success ? 'message-id' : undefined,
            result.error
          );
        }
        
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
          await markMessageSent(user.whatsapp, selectedDatabases);
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
        
        // Add failed user to campaign
        if (currentCampaignId) {
          await addUserToCampaign(
            currentCampaignId,
            user.whatsapp,
            user._sourceDatabase || selectedDatabases[0],
            'failed',
            undefined,
            'Error de conexión'
          );
        }
        
        setSendingResults([...localResults]);
        localErrorCount++;
        setErrorCount(localErrorCount);
      }
      
      if (i < usersToMessage.length - 1) {
        await new Promise(resolve => setTimeout(resolve, getSpeedDelay(sendingSpeed)));
      }
    }
    
    // Complete campaign
    if (currentCampaignId) {
      await completeCampaign(currentCampaignId);
    }
    
    setIsSending(false);
    setIsCompleted(true);
    
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

  const handleLoadMore = async () => {
    if (!pagination?.hasMore) return;
    
    setLoading(true);
    try {
      const response = await fetchFilteredUsers(selectedDatabases, currentPage + 1, quantity);
      setUsers(prev => [...prev, ...response.users]);
      setFilteredUsers(prev => [...prev, ...response.users]);
      setCurrentPage(prev => prev + 1);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading more users:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'send', label: 'Enviar Mensajes', icon: Send, color: 'from-blue-500 to-purple-500' },
    { id: 'campaigns', label: 'Historial de Campañas', icon: History, color: 'from-green-500 to-teal-500' },
    { id: 'settings', label: 'Configuración', icon: Settings, color: 'from-orange-500 to-red-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Modern Header */}
      <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                  WhatsApp Messenger Pro
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Sistema avanzado de mensajería masiva
                </p>
              </div>
            </div>
            
            {databaseInfo && (
              <div className="hidden md:flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 px-4 py-2 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      {databaseInfo.name}
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      ({databaseInfo.count} usuarios)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/20 p-2">
          <nav className="flex space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105`
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'send' && (
          <div className="space-y-8">
            {/* Database Selection */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl p-8 border border-gray-200/20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Database className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Base de Datos</h2>
              </div>
              
              <DatabaseSelector 
                selectedDatabases={selectedDatabases}
                onSelectDatabases={setSelectedDatabases}
                onDatabaseChange={setDatabaseInfo}
              />
            </div>

            {/* Template Selection */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl p-8 border border-gray-200/20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Plantilla de Mensaje</h2>
              </div>
              
              <TemplateSelector 
                templates={templates}
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
                loading={loading}
              />
            </div>

            {/* Test Message Panel */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl p-8 border border-gray-200/20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Send className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Envío de Prueba</h2>
              </div>
              
              <TestMessagePanel 
                selectedTemplate={selectedTemplate}
                selectedDatabases={selectedDatabases}
              />
            </div>

            {/* Users Management */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl p-8 border border-gray-200/20">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Usuarios ({filteredUsers.length})
                  </h2>
                </div>
                <button
                  onClick={handleRefresh}
                  className="flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>
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
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="mb-6">
                <AdvancedFilters
                  availableEstados={availableEstados}
                  availableMedios={availableMedios}
                  filters={advancedFilters}
                  onFiltersChange={setAdvancedFilters}
                />
              </div>

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
              
              {pagination?.hasMore && !loadingAll && quantity !== -1 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleLoadMore}
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
              
              {pagination?.loadedAll && (
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center px-6 py-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
                    <span className="font-medium">✅ Se cargaron TODOS los usuarios ({users.length} total)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <CampaignHistory selectedDatabases={selectedDatabases} />
        )}

        {activeTab === 'settings' && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl p-8 border border-gray-200/20">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Configuración</h2>
            </div>
            
            <div className="text-center py-12">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Configuración del Sistema</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Próximamente: Configuración de API, plantillas personalizadas, y más opciones avanzadas.
              </p>
            </div>
          </div>
        )}
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