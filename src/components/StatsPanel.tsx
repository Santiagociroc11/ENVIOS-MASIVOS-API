import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, MessageCircle, CreditCard, Eye, Trash2, Calendar, Database, UserCheck, SortAsc, SortDesc, CheckCircle, XCircle, ArrowUpDown, DollarSign, PiggyBank, Target, Zap } from 'lucide-react';
import { fetchCampaignsList, fetchCampaignStats, deleteCampaignStats, fetchGlobalStats, fetchCampaignsMiniMetrics } from '../api/services';

interface Campaign {
  campaignId: string;
  templateName: string;
  sentAt: string;
  totalSent: number;
  databases: string[];
  notes: string;
}

interface GlobalStats {
  totalCampaigns: number;
  campañasConDatos: number;
  globalStats: {
    totalEnviados: number;
    totalRespondieron: number;
    totalNuevasPagados: number;
    totalNuevosUpsells: number;
    totalCambiosEstado: number;
  };
  globalEconomicAnalysis: {
    ingresoPorCompra: number;
    ingresoPorUpsell: number;
    costoPorMensaje: number;
    tasaCambio: number;
    ingresoCompras: number;
    ingresoUpsells: number;
    ingresoTotal: number;
    costoTotal: number;
    rentabilidadNeta: number;
    roas: number;
  };
  globalSummary: {
    tasaRespuestaPromedio: string;
    tasaConversionPromedio: string;
    tasaUpsellPromedio: string;
    roasPromedio: string;
    tasaRespuestaGlobal: string;
    tasaConversionGlobal: string;
    tasaUpsellGlobal: string;
  };
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

interface CampaignStats {
  campaign: {
    campaignId: string;
    templateName: string;
    sentAt: string;
    databases: string[];
    notes: string;
  };
  stats: {
    totalEnviados: number;
    respondieron: number;
    nuevasPagados: number;
    nuevosUpsells: number;
    cambiosEstado: number;
    usuariosConPlantilla: number;
    usuariosConCompras: number;
    comprasDirectasPlantilla: number;
  };
  economicAnalysis: {
    ingresoPorCompra: number;
    ingresoPorUpsell: number;
    costoPorMensaje: number;
    tasaCambio: number;
    ingresoCompras: number;
    ingresoUpsells: number;
    ingresoTotal: number;
    costoEnvioUSD: number;
    costoEnvioCOP: number;
    rentabilidadNeta: number;
    roas: number;
    ingresoPromedioPorEnvio: number;
    costoPromedioPorConversion: number;
  };
  summary: {
    tasaRespuesta: string;
    tasaConversion: string;
    tasaUpsell: string;
    efectividadPlantilla: string;
    comprasDirectasDelaPlantilla: string;
    usuariosConFlagMasivo: string;
    ingresoTotal: string;
    costoTotal: string;
    rentabilidadNeta: string;
    roas: string;
    tasaCambio: string;
    ingresoPromedioPorEnvio: string;
    costoPromedioPorConversion: string;
  };
  estadosComparison: Record<string, number>;
  userDetails: any[];
}

const StatsPanel: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [miniMetrics, setMiniMetrics] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingGlobalStats, setLoadingGlobalStats] = useState(false);
  const [loadingMiniMetrics, setLoadingMiniMetrics] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [activeStatsTab, setActiveStatsTab] = useState<'overview' | 'users'>('overview');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'whatsapp', direction: 'asc' });



  useEffect(() => {
    loadData();
  }, [currentPage]);

  // Carga progresiva: primero campañas básicas, luego estadísticas globales, luego métricas mini
  const loadData = async () => {
    console.log('🚀 Starting progressive data loading...');
    
    // 1. Cargar campañas básicas primero (más rápido)
    const campaignsData = await loadCampaigns();
    
    // 2. Cargar estadísticas globales en paralelo con métricas mini (usando los datos de campañas)
    Promise.all([
      loadGlobalStats(),
      loadMiniMetricsForCampaigns(campaignsData?.campaigns || [])
    ]);
  };

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      console.log('📊 Loading basic campaigns from API...');
      const response = await fetchCampaignsList(currentPage, 10);
      console.log('📊 Basic campaigns loaded:', response.campaigns?.length || 0);
      setCampaigns(response.campaigns || []);
      setPagination(response.pagination);
      return response;
    } catch (error) {
      console.error('❌ Error loading campaigns:', error);
      return { campaigns: [], pagination: null };
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalStats = async () => {
    setLoadingGlobalStats(true);
    try {
      console.log('🌍 Loading global statistics...');
      const response = await fetchGlobalStats();
      setGlobalStats(response);
      console.log('🌍 Global stats loaded successfully');
    } catch (error) {
      console.error('❌ Error loading global stats:', error);
    } finally {
      setLoadingGlobalStats(false);
    }
  };

  const loadMiniMetricsForCampaigns = async (campaignsList: Campaign[]) => {
    setLoadingMiniMetrics(true);
    try {
      if (campaignsList.length === 0) {
        console.log('⏩ No campaigns to load metrics for');
        return;
      }
      
      const campaignIds = campaignsList.map(c => c.campaignId);
      console.log('📊 Loading mini metrics for', campaignIds.length, 'campaigns...');
      
      const response = await fetchCampaignsMiniMetrics(campaignIds);
      setMiniMetrics(response.metrics || {});
      console.log('📊 Mini metrics loaded successfully');
    } catch (error) {
      console.error('❌ Error loading mini metrics:', error);
    } finally {
      setLoadingMiniMetrics(false);
    }
  };

  const loadCampaignStats = async (campaignId: string) => {
    setLoadingStats(true);
    try {
      const stats = await fetchCampaignStats(campaignId);
      setCampaignStats(stats);
      setSelectedCampaign(campaignId);
      setActiveStatsTab('overview'); // Reset to overview tab when loading new campaign
    } catch (error) {
      console.error('Error loading campaign stats:', error);
      alert('Error al cargar estadísticas de la campaña');
    } finally {
      setLoadingStats(false);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta campaña? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await deleteCampaignStats(campaignId);
      setCampaigns(campaigns.filter(c => c.campaignId !== campaignId));
      if (selectedCampaign === campaignId) {
        setSelectedCampaign(null);
        setCampaignStats(null);
      }
      alert('Campaña eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Error al eliminar la campaña');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sortUsers = (users: any[], key: string, direction: 'asc' | 'desc') => {
    return [...users].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];
      
      // Handle special cases
      if (key === 'hasResponse') {
        aVal = a.estadoActual === 'respondido-masivo' || a.respondioMasivo;
        bVal = b.estadoActual === 'respondido-masivo' || b.respondioMasivo;
      }
      
      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';
      
      if (direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

  const handleSort = (key: string) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <SortAsc className="h-4 w-4 text-blue-600" /> : 
      <SortDesc className="h-4 w-4 text-blue-600" />;
  };

  const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; percentage?: string; color: string; bgColor: string }> = 
    ({ icon, title, value, percentage, color, bgColor }) => (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${bgColor}`}>
              {icon}
            </div>
            {percentage && (
              <span className={`text-sm font-bold px-2 py-1 rounded-full ${color === 'text-green-600' ? 'bg-green-100 text-green-600' : color === 'text-blue-600' ? 'bg-blue-100 text-blue-600' : color === 'text-purple-600' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                {percentage}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{typeof value === 'string' ? value : value.toLocaleString()}</p>
          </div>
        </div>
      </div>
    );

  // Componente de Embudo de Conversión - Diseño Limpio y Profesional
  const ConversionFunnel: React.FC<{ stats: any }> = ({ stats }) => {
    const funnelSteps = [
      {
        label: "Mensajes Enviados",
        value: stats.totalEnviados,
        percentage: 100,
        description: "Total de mensajes enviados en la campaña"
      },
      {
        label: "Respondieron",
        value: stats.respondieron,
        percentage: stats.totalEnviados > 0 ? (stats.respondieron / stats.totalEnviados * 100) : 0,
        description: "Usuarios que interactuaron después del envío"
      },
      {
        label: "Compraron",
        value: stats.nuevasPagados,
        percentage: stats.totalEnviados > 0 ? (stats.nuevasPagados / stats.totalEnviados * 100) : 0,
        description: "Usuarios que realizaron una compra"
      },
      {
        label: "Con Upsell",
        value: stats.nuevosUpsells,
        percentage: stats.totalEnviados > 0 ? (stats.nuevosUpsells / stats.totalEnviados * 100) : 0,
        description: "Usuarios que compraron productos adicionales"
      }
    ];
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Embudo de Conversión
        </h3>
        
        <div className="space-y-8">
          {funnelSteps.map((step, index) => {
            const dropRate = index > 0 ? 
              (funnelSteps[index - 1].value > 0 ? 
                ((funnelSteps[index - 1].value - step.value) / funnelSteps[index - 1].value * 100) : 0) : 0;
            
            const conversionRate = index > 0 ? 
              (funnelSteps[index - 1].value > 0 ? (step.value / funnelSteps[index - 1].value * 100) : 0) : 100;
            
            return (
              <div key={step.label} className="relative">
                {/* Paso del embudo */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{step.label}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{step.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {step.value.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {step.percentage.toFixed(1)}% del total
                    </div>
                    {index > 0 && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {conversionRate.toFixed(1)}% del paso anterior
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Barra de progreso */}
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-4">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${step.percentage}%` }}
                  ></div>
                </div>
                
                {/* Tasa de abandono */}
                {index > 0 && dropRate > 0 && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-400">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-red-700 dark:text-red-300">
                        ⚠️ Pérdida en este paso:
                      </span>
                      <span className="font-medium text-red-800 dark:text-red-200">
                        {dropRate.toFixed(1)}% ({(funnelSteps[index - 1].value - step.value).toLocaleString()} usuarios)
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Flecha de conexión */}
                {index < funnelSteps.length - 1 && (
                  <div className="flex justify-center mb-2">
                    <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-600"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Resumen final */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Resumen de Conversión</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {stats.totalEnviados > 0 ? ((stats.respondieron / stats.totalEnviados) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Tasa de Respuesta</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {stats.totalEnviados > 0 ? ((stats.nuevasPagados / stats.totalEnviados) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Tasa de Conversión</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {stats.nuevasPagados > 0 ? ((stats.nuevosUpsells / stats.nuevasPagados) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Tasa de Upsell</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente de Análisis Detallado
  const DetailedAnalysis: React.FC<{ stats: any; estadosComparison: any }> = ({ stats, estadosComparison }) => {
    const insights = [];
    
    // Análisis de respuesta
    const responseRate = stats.totalEnviados > 0 ? (stats.respondieron / stats.totalEnviados * 100) : 0;
    if (responseRate > 20) {
      insights.push({
        type: "success",
        icon: "🎉",
        title: "Excelente Engagement",
        message: `Tu tasa de respuesta del ${responseRate.toFixed(1)}% está por encima del promedio (15-20%)`
      });
    } else if (responseRate > 10) {
      insights.push({
        type: "warning", 
        icon: "⚡",
        title: "Buen Rendimiento",
        message: `Tasa de respuesta del ${responseRate.toFixed(1)}% es buena, pero hay margen de mejora`
      });
    } else if (responseRate > 0) {
      insights.push({
        type: "info",
        icon: "📊",
        title: "Oportunidad de Mejora",
        message: `La tasa de respuesta del ${responseRate.toFixed(1)}% puede optimizarse mejorando el mensaje`
      });
    }

    // Análisis de conversión
    const conversionRate = stats.totalEnviados > 0 ? (stats.nuevasPagados / stats.totalEnviados * 100) : 0;
    if (conversionRate > 5) {
      insights.push({
        type: "success",
        icon: "💰",
        title: "Alta Conversión",
        message: `${conversionRate.toFixed(1)}% de conversión es excelente para marketing masivo`
      });
    } else if (conversionRate > 2) {
      insights.push({
        type: "warning",
        icon: "📈", 
        title: "Conversión Moderada",
        message: `${conversionRate.toFixed(1)}% de conversión puede mejorarse con segmentación`
      });
    }

    // Análisis de upsell
    const upsellRate = stats.nuevasPagados > 0 ? (stats.nuevosUpsells / stats.nuevasPagados * 100) : 0;
    if (upsellRate > 30) {
      insights.push({
        type: "success",
        icon: "🚀",
        title: "Upselling Efectivo",
        message: `${upsellRate.toFixed(1)}% de tus clientes compraron productos adicionales`
      });
    } else if (stats.nuevasPagados > 0 && upsellRate === 0) {
      insights.push({
        type: "info",
        icon: "💡",
        title: "Potencial de Upsell",
        message: "Considera implementar estrategias de venta cruzada para aumentar ingresos"
      });
    }

    // Análisis de cambios de estado
    const stateChangeRate = stats.totalEnviados > 0 ? (stats.cambiosEstado / stats.totalEnviados * 100) : 0;
    if (stateChangeRate > 30) {
      insights.push({
        type: "success",
        icon: "🔄",
        title: "Alto Impacto",
        message: `${stateChangeRate.toFixed(1)}% de usuarios cambiaron su estado tras la campaña`
      });
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Eye className="h-5 w-5 mr-2 text-indigo-600" />
          Análisis e Insights
        </h3>
        
        {insights.length > 0 ? (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-xl border-l-4 ${
                insight.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' :
                insight.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
                'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
              }`}>
                <div className="flex items-start">
                  <span className="text-2xl mr-3">{insight.icon}</span>
                  <div>
                    <h4 className={`font-semibold ${
                      insight.type === 'success' ? 'text-green-800 dark:text-green-200' :
                      insight.type === 'warning' ? 'text-yellow-800 dark:text-yellow-200' :
                      'text-blue-800 dark:text-blue-200'
                    }`}>
                      {insight.title}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      insight.type === 'success' ? 'text-green-700 dark:text-green-300' :
                      insight.type === 'warning' ? 'text-yellow-700 dark:text-yellow-300' :
                      'text-blue-700 dark:text-blue-300'
                    }`}>
                      {insight.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">🤔</div>
            <p className="text-gray-500 dark:text-gray-400">No hay suficientes datos para generar insights</p>
            <p className="text-xs text-gray-400 mt-1">Envía más campañas para obtener análisis detallados</p>
          </div>
        )}

        {/* Mejores cambios de estado */}
        {Object.keys(estadosComparison).length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🏆 Principales Transiciones
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(estadosComparison)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .slice(0, 6)
                .map(([transition, count]) => (
                  <div key={transition} className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{transition}</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-full text-xs">
                        {count as React.ReactNode}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Componente de Estadísticas Globales
  const GlobalStatsOverview: React.FC<{ globalStats: GlobalStats }> = ({ globalStats }) => {
    const isRentable = globalStats.globalEconomicAnalysis.rentabilidadNeta > 0;
    const roasColor = globalStats.globalEconomicAnalysis.roas > 2 ? 'text-green-600' : globalStats.globalEconomicAnalysis.roas > 1 ? 'text-yellow-600' : 'text-red-600';
    const roasBgColor = globalStats.globalEconomicAnalysis.roas > 2 ? 'bg-green-50 dark:bg-green-900/20' : globalStats.globalEconomicAnalysis.roas > 1 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20';

    const formatDate = (dateString: string | null) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    return (
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 shadow-2xl mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
              <BarChart3 className="h-7 w-7 mr-3" />
              📊 Estadísticas Globales
            </h2>
            <p className="text-white/80 text-sm">
              Resumen consolidado de todas las campañas ({globalStats.totalCampaigns} campañas, {globalStats.campañasConDatos} con datos)
            </p>
            {globalStats.dateRange.from && globalStats.dateRange.to && (
              <p className="text-white/60 text-xs mt-1">
                📅 Desde {formatDate(globalStats.dateRange.from)} hasta {formatDate(globalStats.dateRange.to)}
              </p>
            )}
          </div>
          
          <div className={`px-4 py-2 rounded-xl ${roasBgColor} border border-white/20`}>
            <div className="text-center">
              <div className={`text-2xl font-bold ${roasColor}`}>
                {globalStats.globalEconomicAnalysis.roas.toFixed(1)}x
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">ROAS Global</div>
            </div>
          </div>
        </div>

        {/* Métricas principales en grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
            <div className="text-2xl font-bold text-white mb-1">
              {globalStats.globalStats.totalEnviados.toLocaleString()}
            </div>
            <div className="text-white/80 text-sm font-medium">Total Enviados</div>
            <div className="text-white/60 text-xs mt-1">📱 Mensajes</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
            <div className="text-2xl font-bold text-white mb-1">
              {globalStats.globalStats.totalRespondieron.toLocaleString()}
            </div>
            <div className="text-white/80 text-sm font-medium">Respondieron</div>
            <div className="text-white/60 text-xs mt-1">{globalStats.globalSummary.tasaRespuestaGlobal}</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
            <div className="text-2xl font-bold text-white mb-1">
              {globalStats.globalStats.totalNuevasPagados.toLocaleString()}
            </div>
            <div className="text-white/80 text-sm font-medium">Nuevos Pagos</div>
            <div className="text-white/60 text-xs mt-1">{globalStats.globalSummary.tasaConversionGlobal}</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
            <div className="text-2xl font-bold text-white mb-1">
              {globalStats.globalStats.totalNuevosUpsells.toLocaleString()}
            </div>
            <div className="text-white/80 text-sm font-medium">Upsells</div>
            <div className="text-white/60 text-xs mt-1">{globalStats.globalSummary.tasaUpsellGlobal}</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
            <div className="text-2xl font-bold text-white mb-1">
              ${globalStats.globalEconomicAnalysis.ingresoTotal.toLocaleString()}
            </div>
            <div className="text-white/80 text-sm font-medium">Ingresos</div>
            <div className="text-white/60 text-xs mt-1">💰 COP</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
            <div className="text-2xl font-bold text-white mb-1">
              ${globalStats.globalEconomicAnalysis.costoTotal.toLocaleString()}
            </div>
            <div className="text-white/80 text-sm font-medium">Costos</div>
            <div className="text-white/60 text-xs mt-1">📊 COP</div>
          </div>
          
          <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 ${isRentable ? 'ring-2 ring-green-400' : 'ring-2 ring-red-400'}`}>
            <div className={`text-2xl font-bold mb-1 ${isRentable ? 'text-green-200' : 'text-red-200'}`}>
              ${globalStats.globalEconomicAnalysis.rentabilidadNeta.toLocaleString()}
            </div>
            <div className="text-white/80 text-sm font-medium">Rentabilidad</div>
            <div className={`text-xs mt-1 ${isRentable ? 'text-green-300' : 'text-red-300'}`}>
              {isRentable ? '✅ Rentable' : '❌ No rentable'}
            </div>
          </div>
        </div>

        {/* Promedios por campaña */}
        <div className="mt-6 pt-6 border-t border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            📈 Promedios por Campaña
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-white">{globalStats.globalSummary.tasaRespuestaPromedio}</div>
              <div className="text-white/70 text-xs">Respuesta Promedio</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-white">{globalStats.globalSummary.tasaConversionPromedio}</div>
              <div className="text-white/70 text-xs">Conversión Promedio</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-white">{globalStats.globalSummary.tasaUpsellPromedio}</div>
              <div className="text-white/70 text-xs">Upsell Promedio</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-white">{globalStats.globalSummary.roasPromedio}</div>
              <div className="text-white/70 text-xs">ROAS Promedio</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente de Análisis Económico
  const EconomicAnalysis: React.FC<{ economicAnalysis: any; summary: any }> = ({ economicAnalysis }) => {
    const isRentable = economicAnalysis.rentabilidadNeta > 0;
    const roasColor = economicAnalysis.roas > 2 ? 'text-green-600' : economicAnalysis.roas > 1 ? 'text-yellow-600' : 'text-red-600';
    const roasBgColor = economicAnalysis.roas > 2 ? 'bg-green-50 dark:bg-green-900/20' : economicAnalysis.roas > 1 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20';

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Ingresos */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <DollarSign className="h-6 w-6 mr-2 text-green-600" />
            💰 Análisis de Ingresos
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos por Compras</p>
                <p className="text-xs text-gray-500">({economicAnalysis.ingresoCompras / economicAnalysis.ingresoPorCompra} compras × $12,900)</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                ${economicAnalysis.ingresoCompras.toLocaleString()} COP
              </p>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos por Upsells</p>
                <p className="text-xs text-gray-500">({economicAnalysis.ingresoUpsells / economicAnalysis.ingresoPorUpsell} upsells × $19,000)</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                ${economicAnalysis.ingresoUpsells.toLocaleString()} COP
              </p>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">Ingreso Total</p>
                <p className="text-3xl font-bold text-purple-600">
                  ${economicAnalysis.ingresoTotal.toLocaleString()} COP
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Costos y ROI */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <Target className="h-6 w-6 mr-2 text-purple-600" />
            📊 Rentabilidad
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Costo de Envío</p>
                <p className="text-xs text-gray-500">(${economicAnalysis.costoEnvioUSD.toFixed(2)} USD × ${economicAnalysis.tasaCambio.toFixed(2)})</p>
              </div>
              <p className="text-2xl font-bold text-red-600">
                ${economicAnalysis.costoEnvioCOP.toLocaleString()} COP
              </p>
            </div>
            
            <div className={`flex justify-between items-center p-4 rounded-lg ${isRentable ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rentabilidad Neta</p>
                <p className="text-xs text-gray-500">(Ingresos - Costos)</p>
              </div>
              <p className={`text-2xl font-bold ${isRentable ? 'text-green-600' : 'text-red-600'}`}>
                ${economicAnalysis.rentabilidadNeta.toLocaleString()} COP
              </p>
            </div>
            
            <div className={`p-4 rounded-lg ${roasBgColor}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ROAS (Return on Ad Spend)</p>
                  <p className="text-xs text-gray-500">Ingresos / Inversión</p>
                </div>
                <p className={`text-3xl font-bold ${roasColor}`}>
                  {economicAnalysis.roas.toFixed(1)}x
                </p>
              </div>
              <div className="mt-2">
                {economicAnalysis.roas > 2 ? (
                  <p className="text-xs text-green-600 flex items-center">
                    ✅ ¡Excelente ROAS! (mayor a 2x)
                  </p>
                ) : economicAnalysis.roas > 1 ? (
                  <p className="text-xs text-yellow-600 flex items-center">
                    ⚠️ ROAS positivo pero optimizable
                  </p>
                ) : (
                  <p className="text-xs text-red-600 flex items-center">
                    ❌ ROAS bajo (menor a 1x)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Métricas Adicionales */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Zap className="h-6 w-6 mr-2" />
              ⚡ Métricas de Eficiencia
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className="text-2xl font-bold text-white mb-1">
                  ${Math.round(economicAnalysis.ingresoPromedioPorEnvio).toLocaleString()}
                </div>
                <div className="text-white/80 text-sm font-medium">COP por Envío</div>
                <div className="text-white/60 text-xs mt-1">Ingreso promedio</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className="text-2xl font-bold text-white mb-1">
                  ${Math.round(economicAnalysis.costoPromedioPorConversion).toLocaleString()}
                </div>
                <div className="text-white/80 text-sm font-medium">COP por Conversión</div>
                <div className="text-white/60 text-xs mt-1">Costo de adquisición</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className="text-2xl font-bold text-white mb-1">
                  ${economicAnalysis.tasaCambio.toFixed(0)}
                </div>
                <div className="text-white/80 text-sm font-medium">COP/USD</div>
                <div className="text-white/60 text-xs mt-1">Tasa de cambio</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className="text-2xl font-bold text-white mb-1">
                  ${(economicAnalysis.costoPorMensaje * 1000).toFixed(1)}
                </div>
                <div className="text-white/80 text-sm font-medium">USD por 1000 msgs</div>
                <div className="text-white/60 text-xs mt-1">Costo masivo</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente de Lista de Usuarios
  const UsersTable: React.FC<{ userDetails: any[]; campaignDate: string }> = ({ userDetails, campaignDate }) => {
    const sortedUsers = sortUsers(userDetails, sortConfig.key, sortConfig.direction);
    
    // Calcular estadísticas rápidas de la tabla
    const totalUsers = userDetails.length;
    const respondedUsers = userDetails.filter(user => user.estadoActual === 'respondido-masivo' || user.respondioMasivo).length;
    const stateChanges = userDetails.filter(user => user.estadoInicial !== user.estadoActual).length;
    
    const getResponseIndicator = (user: any) => {
      const hasResponse = user.estadoActual === 'respondido-masivo' || user.respondioMasivo;
      return hasResponse ? (
        <div className="flex items-center text-green-600">
          <CheckCircle className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">Respondió</span>
        </div>
      ) : (
        <div className="flex items-center text-gray-400">
          <XCircle className="h-4 w-4 mr-1" />
          <span className="text-xs">Sin respuesta</span>
        </div>
      );
    };

    const getStatusBadge = (estado: string) => {
      const colors: Record<string, string> = {
        'respondido-masivo': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
        'respondido': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
        'pagado': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
        'bienvenida': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
        'lead': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
        'medio': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      };
      
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[estado] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'}`}>
          {estado}
        </span>
      );
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
            Lista de Usuarios ({userDetails.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Detalles completos de todos los usuarios de la campaña
          </p>
          
          {/* Resumen rápido */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{totalUsers}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Total Usuarios</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">{respondedUsers}</div>
              <div className="text-xs text-green-600 dark:text-green-400">Respondieron ({totalUsers > 0 ? ((respondedUsers / totalUsers) * 100).toFixed(1) : 0}%)</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{stateChanges}</div>
              <div className="text-xs text-purple-600 dark:text-purple-400">Cambios de Estado ({totalUsers > 0 ? ((stateChanges / totalUsers) * 100).toFixed(1) : 0}%)</div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('whatsapp')}
                >
                  <div className="flex items-center space-x-1">
                    <span>WhatsApp</span>
                    {getSortIcon('whatsapp')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('estadoInicial')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Estado Inicial</span>
                    {getSortIcon('estadoInicial')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('estadoActual')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Estado Actual</span>
                    {getSortIcon('estadoActual')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha Envío
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('hasResponse')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Respuesta</span>
                    {getSortIcon('hasResponse')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('sourceDatabase')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Base de Datos</span>
                    {getSortIcon('sourceDatabase')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedUsers.map((user) => {
                const hasResponse = user.estadoActual === 'respondido-masivo' || user.respondioMasivo;
                return (
                  <tr key={user.whatsapp} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${hasResponse ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {hasResponse && (
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        )}
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.whatsapp}
                        </div>
                      </div>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.estadoInicial)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.estadoActual)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(campaignDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getResponseIndicator(user)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">
                      {user.sourceDatabase}
                    </span>
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {userDetails.length === 0 && (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">No hay usuarios en esta campaña</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="mr-3 h-8 w-8 text-blue-600" />
              Estadísticas de Campañas
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Analiza el rendimiento de tus campañas de envío masivo
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas Globales */}
      {loadingGlobalStats ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center mb-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Cargando estadísticas globales...</p>
        </div>
      ) : globalStats ? (
        <GlobalStatsOverview globalStats={globalStats} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center mb-8">
          <BarChart3 className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Sin estadísticas globales
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            No se pudieron cargar las estadísticas globales
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de Campañas */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                Campañas Recientes
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Selecciona una campaña para ver detalles
              </p>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Cargando...</p>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">No hay campañas registradas</p>
                  <p className="text-sm text-gray-400">Envía mensajes para ver estadísticas aquí</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.campaignId}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedCampaign === campaign.campaignId
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => loadCampaignStats(campaign.campaignId)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                          {campaign.templateName}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCampaign(campaign.campaignId);
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {campaign.totalSent} enviados
                        </span>
                        <span>{formatDate(campaign.sentAt)}</span>
                      </div>
                      
                      {campaign.databases.length > 0 && (
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <Database className="h-3 w-3 mr-1" />
                          <span>{campaign.databases.join(', ')}</span>
                        </div>
                      )}

                      {/* Métricas Mini */}
                      {miniMetrics[campaign.campaignId] ? (
                        <div className="mt-3 space-y-2">
                          {/* Primera fila de métricas */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-center">
                              <div className="text-xs font-semibold text-green-700 dark:text-green-300">
                                {miniMetrics[campaign.campaignId].nuevasPagados}
                              </div>
                              <div className="text-[10px] text-green-600 dark:text-green-400">
                                {miniMetrics[campaign.campaignId].tasaConversion}
                              </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-center">
                              <div className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                {miniMetrics[campaign.campaignId].respondieron}
                              </div>
                              <div className="text-[10px] text-blue-600 dark:text-blue-400">
                                {miniMetrics[campaign.campaignId].tasaRespuesta}
                              </div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded text-center">
                              <div className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                {miniMetrics[campaign.campaignId].nuevosUpsells}
                              </div>
                              <div className="text-[10px] text-purple-600 dark:text-purple-400">
                                {miniMetrics[campaign.campaignId].tasaUpsell}
                              </div>
                            </div>
                          </div>
                          
                          {/* Segunda fila: ROAS y Rentabilidad */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className={`px-2 py-1 rounded text-center ${
                              miniMetrics[campaign.campaignId].roasNumerico > 2 
                                ? 'bg-green-50 dark:bg-green-900/20' 
                                : miniMetrics[campaign.campaignId].roasNumerico > 1 
                                  ? 'bg-yellow-50 dark:bg-yellow-900/20' 
                                  : 'bg-red-50 dark:bg-red-900/20'
                            }`}>
                              <div className={`text-xs font-bold ${
                                miniMetrics[campaign.campaignId].roasNumerico > 2 
                                  ? 'text-green-700 dark:text-green-300' 
                                  : miniMetrics[campaign.campaignId].roasNumerico > 1 
                                    ? 'text-yellow-700 dark:text-yellow-300' 
                                    : 'text-red-700 dark:text-red-300'
                              }`}>
                                {miniMetrics[campaign.campaignId].roas}
                              </div>
                              <div className="text-[10px] text-gray-600 dark:text-gray-400">ROAS</div>
                            </div>
                            <div className={`px-2 py-1 rounded text-center ${
                              miniMetrics[campaign.campaignId].rentabilidadNumerica > 0 
                                ? 'bg-green-50 dark:bg-green-900/20' 
                                : 'bg-red-50 dark:bg-red-900/20'
                            }`}>
                              <div className={`text-xs font-bold ${
                                miniMetrics[campaign.campaignId].rentabilidadNumerica > 0 
                                  ? 'text-green-700 dark:text-green-300' 
                                  : 'text-red-700 dark:text-red-300'
                              }`}>
                                ${Math.round(miniMetrics[campaign.campaignId].rentabilidadNumerica / 1000)}k
                              </div>
                              <div className="text-[10px] text-gray-600 dark:text-gray-400">
                                {miniMetrics[campaign.campaignId].rentabilidadNumerica > 0 ? 'Ganancia' : 'Pérdida'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : loadingMiniMetrics ? (
                        <div className="mt-3 p-2 text-center">
                          <div className="text-xs text-gray-500 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                            Cargando métricas...
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 p-2 text-center">
                          <div className="text-xs text-gray-400">
                            Métricas no disponibles
                          </div>
                        </div>
                      )}
                      
                      {campaign.notes && (
                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {campaign.notes}
                        </p>
                      )}
                      
                      <div className="mt-2 flex justify-between items-center">
                        <div className="text-[10px] text-gray-400">
                          {miniMetrics[campaign.campaignId] ? 'Con métricas' : loadingMiniMetrics ? 'Cargando...' : 'Sin métricas'}
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-xs flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          Ver detalles
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Paginación */}
              {pagination && pagination.pages > 1 && (
                <div className="mt-6 flex justify-between items-center">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-500">
                    Página {currentPage} de {pagination.pages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                    disabled={currentPage === pagination.pages}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Estadísticas Detalladas */}
        <div className="lg:col-span-2">
          {loadingStats ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Cargando estadísticas...</p>
            </div>
          ) : campaignStats ? (
            <div className="space-y-6">
              {/* Header de la campaña */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {campaignStats.campaign.templateName}
                </h2>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(campaignStats.campaign.sentAt)}
                  </span>
                  <span className="flex items-center">
                    <Database className="h-4 w-4 mr-1" />
                    {campaignStats.campaign.databases.join(', ')}
                  </span>
                </div>
                {campaignStats.campaign.notes && (
                  <p className="mt-3 text-gray-700 dark:text-gray-300">
                    {campaignStats.campaign.notes}
                  </p>
                )}
              </div>

              {/* Pestañas de Estadísticas */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                {/* Navegación de pestañas */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    <button
                      onClick={() => setActiveStatsTab('overview')}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeStatsTab === 'overview'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <BarChart3 className="h-4 w-4 inline mr-2" />
                      Resumen y Análisis
                    </button>
                    <button
                      onClick={() => setActiveStatsTab('users')}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeStatsTab === 'users'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <UserCheck className="h-4 w-4 inline mr-2" />
                      Lista de Usuarios ({campaignStats.userDetails?.length || 0})
                    </button>
                  </nav>
                </div>

                {/* Contenido de pestañas */}
                <div className="p-6">
                  {activeStatsTab === 'overview' ? (
                    <div className="space-y-6">
                      {/* Embudo de Conversión - Vista Principal */}
                      <ConversionFunnel stats={campaignStats.stats} />

                      {/* Análisis Económico */}
                      <EconomicAnalysis economicAnalysis={campaignStats.economicAnalysis} summary={campaignStats.summary} />

                      {/* Análisis Detallado e Insights */}
                      <DetailedAnalysis stats={campaignStats.stats} estadosComparison={campaignStats.estadosComparison} />
                    </div>
                  ) : (
                    <div className="-m-6">
                      <UsersTable 
                        userDetails={campaignStats.userDetails || []} 
                        campaignDate={campaignStats.campaign.sentAt} 
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Métricas principales - Resumen Rápido */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                <StatCard
                  icon={<Users className="h-5 w-5 text-white" />}
                  title="Total Enviados"
                  value={campaignStats.stats.totalEnviados}
                  color="text-blue-600"
                  bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatCard
                  icon={<MessageCircle className="h-5 w-5 text-white" />}
                  title="Respondieron"
                  value={campaignStats.stats.respondieron}
                  percentage={campaignStats.summary.tasaRespuesta}
                  color="text-green-600"
                  bgColor="bg-gradient-to-br from-green-500 to-green-600"
                />
                <StatCard
                  icon={<CreditCard className="h-5 w-5 text-white" />}
                  title="Nuevos Pagos"
                  value={campaignStats.stats.nuevasPagados}
                  percentage={campaignStats.summary.tasaConversion}
                  color="text-purple-600"
                  bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
                />
                <StatCard
                  icon={<TrendingUp className="h-5 w-5 text-white" />}
                  title="Upsells"
                  value={campaignStats.stats.nuevosUpsells}
                  percentage={campaignStats.summary.tasaUpsell}
                  color="text-orange-600"
                  bgColor="bg-gradient-to-br from-orange-500 to-orange-600"
                />
                <StatCard
                  icon={<DollarSign className="h-5 w-5 text-white" />}
                  title="Ingresos"
                  value={campaignStats.summary.ingresoTotal}
                  color="text-emerald-600"
                  bgColor="bg-gradient-to-br from-emerald-500 to-emerald-600"
                />
                <StatCard
                  icon={<PiggyBank className="h-5 w-5 text-white" />}
                  title="ROAS"
                  value={campaignStats.summary.roas}
                  color={campaignStats.economicAnalysis.roas > 2 ? "text-green-600" : campaignStats.economicAnalysis.roas > 1 ? "text-yellow-600" : "text-red-600"}
                  bgColor={campaignStats.economicAnalysis.roas > 2 ? "bg-gradient-to-br from-green-500 to-green-600" : campaignStats.economicAnalysis.roas > 1 ? "bg-gradient-to-br from-yellow-500 to-yellow-600" : "bg-gradient-to-br from-red-500 to-red-600"}
                />
              </div>

              {/* Alerta de precisión de datos */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      📊 Información sobre las Estadísticas
                    </h3>
                    <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                      <p>• <strong>Respuestas:</strong> Solo usuarios que cambiaron a estado "respondido" después del envío</p>
                      <p>• <strong>Nuevos Pagos:</strong> Solo pagos registrados después de la fecha de envío de la campaña</p>
                      <p>• <strong>Upsells:</strong> Solo ventas adicionales posteriores al envío</p>
                      <p>• Los datos se filtran por timestamp para mayor precisión temporal</p>
                    </div>
                  </div>
                </div>
              </div>



              {/* Resumen de rendimiento */}
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <BarChart3 className="h-6 w-6 mr-2" />
                  Resumen de Rendimiento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                    <div className="text-2xl font-bold text-white mb-1">{campaignStats.summary.tasaRespuesta}</div>
                    <div className="text-white/80 text-sm font-medium">Tasa de Respuesta</div>
                    <div className="text-white/60 text-xs mt-1">📱 Interacciones</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                    <div className="text-2xl font-bold text-white mb-1">{campaignStats.summary.tasaConversion}</div>
                    <div className="text-white/80 text-sm font-medium">Tasa de Conversión</div>
                    <div className="text-white/60 text-xs mt-1">💳 Nuevos pagos</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                    <div className="text-2xl font-bold text-white mb-1">{campaignStats.summary.tasaUpsell}</div>
                    <div className="text-white/80 text-sm font-medium">Tasa de Upsell</div>
                    <div className="text-white/60 text-xs mt-1">🚀 Ventas adicionales</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                    <div className="text-2xl font-bold text-white mb-1">{campaignStats.summary.rentabilidadNeta}</div>
                    <div className="text-white/80 text-sm font-medium">Rentabilidad</div>
                    <div className="text-white/60 text-xs mt-1">💰 Ganancia neta</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                    <div className="text-2xl font-bold text-white mb-1">{campaignStats.summary.roas}</div>
                    <div className="text-white/80 text-sm font-medium">ROAS</div>
                    <div className="text-white/60 text-xs mt-1">📈 Return on Ad Spend</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
              <BarChart3 className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                Selecciona una campaña
              </h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Elige una campaña de la lista para ver sus estadísticas detalladas
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;