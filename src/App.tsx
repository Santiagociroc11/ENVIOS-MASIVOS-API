import React, { useState, useEffect, useRef } from 'react';
import { Send, Database, MessageSquare, History, Settings, BarChart3 } from 'lucide-react';
import SendingModal from './components/SendingModal';
import CampaignHistory from './components/CampaignHistory';
import TemplateManagement from './components/TemplateManagement';
import StepByStepSending from './components/StepByStepSending';
import SettingsPanel from './components/SettingsPanel';
import StatsPanel from './components/StatsPanel';
import { fetchConfiguredTemplates, fetchFilteredUsers, sendTemplateMessage, fetchEstados, fetchMedios, createCampaign, addUserToCampaign, completeCampaign, createCampaignStats } from './api/services';
import { ConfiguredTemplate, User } from './types';

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

type TabType = 'send' | 'campaigns' | 'settings' | 'stats';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('send');
  const [selectedDatabases, setSelectedDatabases] = useState<string[]>(['bot-win-4']); // ✅ Solo BD4 - Base Unificada
  const [databaseInfo, setDatabaseInfo] = useState<any>(null);
  const [templates, setTemplates] = useState<ConfiguredTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ConfiguredTemplate | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(100);
  const [loadingAll, setLoadingAll] = useState<boolean>(false);
  const [sendingOrder, setSendingOrder] = useState<'asc' | 'desc'>('desc');
  const [sortCriteria, setSortCriteria] = useState<'ingreso' | 'medio_at'>('medio_at');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);

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

  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null);
  
  const sendingControlRef = useRef<{ cancel: boolean; pause: boolean }>({ cancel: false, pause: false });

  // Fetch templates and users on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const shouldLoadAll = quantity === -1;
      setLoadingAll(shouldLoadAll);
      
      try {
        const templatesData = await fetchConfiguredTemplates();
        console.log('🔍 Plantillas configuradas obtenidas:', templatesData);
        setTemplates(templatesData);
        
        if (selectedDatabases.length > 0) {
          const response = await fetchFilteredUsers(selectedDatabases, 1, quantity, shouldLoadAll, sendingOrder, sortCriteria, advancedFilters, searchTerm);
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
  }, [selectedDatabases, currentPage, quantity, sendingOrder, sortCriteria, advancedFilters, searchTerm]);

  // Since filters are now applied on backend, just use users directly
  useEffect(() => {
    // Backend now handles filtering, sorting, and search
    // Just set filteredUsers to the users from backend
    setFilteredUsers(users);
  }, [users]);



  const handleRefresh = async () => {
    setLoading(true);
    const shouldLoadAll = quantity === -1;
    setLoadingAll(shouldLoadAll);
    
    try {
      if (selectedDatabases.length > 0) {
        const response = await fetchFilteredUsers(selectedDatabases, 1, quantity, shouldLoadAll, sendingOrder, sortCriteria, advancedFilters, searchTerm);
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

  const handleToggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.whatsapp));
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
    sendingControlRef.current = { cancel: false, pause: false };
  };

  const handleSendMessages = async () => {
    console.log('🚀 === INICIANDO ENVÍO DE MENSAJES ===');
    console.log('📋 Selected template:', selectedTemplate);
    console.log('👥 Selected users count:', selectedUsers.length);
    console.log('🗄️ Selected databases:', selectedDatabases);
    
    if (!selectedTemplate) {
      console.error('❌ No template selected');
      alert('❌ Por favor selecciona una plantilla antes de enviar');
      return;
    }
    
    if (selectedUsers.length === 0) {
      console.error('❌ No users selected');
      alert('❌ Por favor selecciona al menos un usuario');
      return;
    }
    
    if (!selectedDatabases || selectedDatabases.length === 0) {
      console.error('❌ No databases selected');
      alert('❌ Por favor selecciona al menos una base de datos');
      return;
    }
    
    // Create campaign first
    const campaignName = `${selectedTemplate.templateName} - ${new Date().toLocaleDateString()}`;
    console.log('📋 Creating campaign with name:', campaignName);
    
         const campaign = await createCampaign(
       campaignName,
       selectedTemplate.templateName,
       selectedTemplate.language || 'es',
       ['bot-win-4'] // BD4 unificada - todas las campañas usan BD4
     );
    
    if (!campaign) {
      console.error('❌ Failed to create campaign');
      alert('❌ Error al crear la campaña. Revisa los logs para más detalles.');
      return;
    }
    
    console.log('✅ Campaign created successfully:', campaign);

    // Las estadísticas se crearán al final del envío con los usuarios que realmente recibieron mensajes
    console.log('🆔 Campaign ID:', campaign.campaignId);
    
    const campaignId = campaign.campaignId; // Capturar el ID directamente
    setCurrentCampaignId(campaignId);
    console.log('✅ currentCampaignId set to:', campaignId);
    resetSendingState();
    setIsSending(true);
    setShowSendingModal(true);
    
    const usersToMessage = filteredUsers.filter(user => 
      selectedUsers.includes(user.whatsapp)
    );
    
    console.log('👥 === ANÁLISIS DE USUARIOS PARA ENVÍO ===');
    console.log('📊 filteredUsers count:', filteredUsers.length);
    console.log('📊 selectedUsers count:', selectedUsers.length);
    console.log('📊 usersToMessage count:', usersToMessage.length);
    console.log('📋 First usersToMessage example:', usersToMessage[0]);
    console.log('🎯 Campaign ID to use:', campaign.campaignId);
    
    if (usersToMessage.length === 0) {
      console.error('❌ NO USERS TO MESSAGE - STOPPING');
      alert('❌ No hay usuarios para enviar mensajes');
      setIsSending(false);
      setShowSendingModal(false);
      return;
    }
    
    let localSuccessCount = 0;
    let localErrorCount = 0;
    const localResults: SendingResult[] = [];
    
    console.log('🔄 === INICIANDO BUCLE DE ENVÍO ===');
    console.log('🆔 campaignId to use:', campaignId);
    for (let i = 0; i < usersToMessage.length; i++) {
      console.log(`📤 Enviando mensaje ${i + 1}/${usersToMessage.length}`);
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
      console.log(`👤 Usuario ${i + 1}:`, user);
      console.log(`📱 WhatsApp: ${user.whatsapp}`);
      console.log(`🗄️ Source DB: ${user._sourceDatabase || 'N/A'}`);
      
      setCurrentSendingIndex(i + 1);
      
      try {
        console.log('🚀 Enviando mensaje via WhatsApp API...');
                 const result = await sendTemplateMessage(user.whatsapp, selectedTemplate.templateName, ['bot-win-4']); // BD4 unificada
        console.log('📤 Resultado sendTemplateMessage:', result);
        
        // Add user to campaign
        console.log('📊 Agregando usuario a campaña...');
        console.log('🆔 Campaign ID:', campaignId);
        
        if (campaignId) {
          const campaignData = {
            campaignId: campaignId,
            whatsapp: user.whatsapp,
            database: 'bot-win-4', // BD4 unificada
            status: result.success ? 'sent' : 'failed',
            messageId: result.success ? 'message-id' : undefined,
            error: result.error
          };
          console.log('📋 Datos para campaña:', campaignData);
          
          const campaignResult = await addUserToCampaign(
            campaignId,
            user.whatsapp,
            'bot-win-4', // BD4 unificada - todos los usuarios están aquí
            result.success ? 'sent' : 'failed',
            result.success ? 'message-id' : undefined,
            result.error
          );
          console.log('✅ Resultado addUserToCampaign:', campaignResult);
        } else {
          console.error('❌ NO CAMPAIGN ID - Cannot add user to campaign');
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
          // ✅ REMOVED: markMessageSent() is redundant - sendTemplateMessage() already marks user as sent
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
             'bot-win-4', // BD4 unificada - todos los usuarios están aquí
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
    
    // Crear estadísticas de campaña con usuarios que REALMENTE recibieron mensajes
    console.log('📊 === CREANDO ESTADÍSTICAS REALES ===');
    try {
      const successfulResults = localResults.filter(result => result.success);
      const actualUsersSent = successfulResults.map(result => {
        // Buscar el usuario original en filteredUsers
        return filteredUsers.find(user => user.whatsapp === result.phoneNumber);
      }).filter(user => user !== undefined); // Filtrar any undefined users
      
      console.log('📊 Total usuarios planeados:', usersToMessage.length);
      console.log('📊 Usuarios que realmente recibieron mensajes:', actualUsersSent.length);
      console.log('📊 Template:', selectedTemplate.templateName);
      console.log('📊 Databases:', selectedDatabases);
      console.log('📊 Sending order:', sendingOrder);
      
      if (actualUsersSent.length > 0) {
        const statsResult = await createCampaignStats({
          templateName: selectedTemplate.templateName,
          usersList: actualUsersSent,
          databases: selectedDatabases,
          sendingOrder: sendingOrder,
          notes: `Envío realizado - ${actualUsersSent.length} de ${usersToMessage.length} usuarios enviados (${sendingControlRef.current.cancel ? 'CANCELADO' : 'COMPLETADO'}) - ordenados por ${sortCriteria === 'ingreso' ? 'fecha de registro' : 'fecha de pago'}`
        });
        
        console.log('✅ Campaign stats created successfully with real data:', statsResult);
      } else {
        console.log('⚠️ No users received messages successfully, skipping stats creation');
      }
    } catch (statsError: any) {
      console.error('⚠️ Error creating campaign stats (continuing):', statsError);
      console.error('⚠️ Stats error details:', statsError.response?.data);
    }
    
    // Complete campaign
    console.log('🏁 === COMPLETANDO CAMPAÑA ===');
    console.log('🆔 Campaign ID:', campaignId);
    
    if (campaignId) {
      console.log('✅ Calling completeCampaign...');
      const completeResult = await completeCampaign(campaignId);
      console.log('📊 Complete campaign result:', completeResult);
    } else {
      console.error('❌ NO CAMPAIGN ID - Cannot complete campaign');
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
      const response = await fetchFilteredUsers(selectedDatabases, currentPage + 1, quantity, false, sendingOrder, sortCriteria, advancedFilters, searchTerm);
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

  const allUsersSelected = selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length;

  const tabs = [
    { id: 'send', label: 'Enviar Mensajes', icon: Send, color: 'from-blue-500 to-purple-500' },
    { id: 'templates', label: 'Gestión de Plantillas', icon: MessageSquare, color: 'from-green-500 to-emerald-500' },
    { id: 'campaigns', label: 'Historial de Campañas', icon: History, color: 'from-green-500 to-teal-500' },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3, color: 'from-purple-500 to-pink-500' },
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
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
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
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'send' && (
          <StepByStepSending
            selectedDatabases={selectedDatabases}
            templates={templates}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
            loading={loading}
            filteredUsers={filteredUsers}
            selectedUsers={selectedUsers}
            onToggleSelection={toggleUserSelection}
            onToggleSelectAll={handleToggleSelectAll}
            allUsersSelected={allUsersSelected}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            availableEstados={availableEstados}
            availableMedios={availableMedios}
            advancedFilters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            quantity={quantity}
            setQuantity={setQuantity}
            onSendMessages={handleSendMessages}
            isSending={isSending}
            onRefresh={handleRefresh}
            sendingOrder={sendingOrder}
            setSendingOrder={setSendingOrder}
            sortCriteria={sortCriteria}
            setSortCriteria={setSortCriteria}
            pagination={pagination}
            loadingAll={loadingAll}
            users={users}
            onLoadMore={handleLoadMore}
          />
        )}

        {activeTab === 'templates' && (
          <TemplateManagement />
        )}

        {activeTab === 'campaigns' && (
          <CampaignHistory selectedDatabases={selectedDatabases} />
        )}

        {activeTab === 'stats' && (
          <StatsPanel />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel
            selectedDatabases={selectedDatabases}
            onSelectDatabases={setSelectedDatabases}
            onDatabaseChange={setDatabaseInfo}
          />
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
                 templateName={selectedTemplate?.templateName || ''}
      />
    </div>
  );
}

export default App;