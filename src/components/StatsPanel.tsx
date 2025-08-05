import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, MessageCircle, CreditCard, Eye, Trash2, Calendar, Database } from 'lucide-react';
import { fetchCampaignsList, fetchCampaignStats, deleteCampaignStats, createCampaignStats } from '../api/services';

interface Campaign {
  campaignId: string;
  templateName: string;
  sentAt: string;
  totalSent: number;
  databases: string[];
  notes: string;
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
  };
  summary: {
    tasaRespuesta: string;
    tasaConversion: string;
    tasaUpsell: string;
  };
  estadosComparison: Record<string, number>;
  userDetails: any[];
}

const StatsPanel: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);



  useEffect(() => {
    loadCampaigns();
  }, [currentPage]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      console.log('📊 Loading campaigns from API...');
      const response = await fetchCampaignsList(currentPage, 10);
      console.log('📊 API Response:', response);
      setCampaigns(response.campaigns || []);
      setPagination(response.pagination);
      console.log('📊 Campaigns loaded:', response.campaigns?.length || 0);
    } catch (error) {
      console.error('❌ Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignStats = async (campaignId: string) => {
    setLoadingStats(true);
    try {
      const stats = await fetchCampaignStats(campaignId);
      setCampaignStats(stats);
      setSelectedCampaign(campaignId);
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
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                      
                      {campaign.notes && (
                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {campaign.notes}
                        </p>
                      )}
                      
                      <div className="mt-2 flex justify-end">
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

              {/* Métricas principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                  icon={<Users className="h-6 w-6 text-white" />}
                  title="Total Enviados"
                  value={campaignStats.stats.totalEnviados}
                  color="text-blue-600"
                  bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatCard
                  icon={<MessageCircle className="h-6 w-6 text-white" />}
                  title="Respondieron"
                  value={campaignStats.stats.respondieron}
                  percentage={campaignStats.summary.tasaRespuesta}
                  color="text-green-600"
                  bgColor="bg-gradient-to-br from-green-500 to-green-600"
                />
                <StatCard
                  icon={<CreditCard className="h-6 w-6 text-white" />}
                  title="Nuevos Pagos"
                  value={campaignStats.stats.nuevasPagados}
                  percentage={campaignStats.summary.tasaConversion}
                  color="text-purple-600"
                  bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
                />
                <StatCard
                  icon={<TrendingUp className="h-6 w-6 text-white" />}
                  title="Upsells"
                  value={campaignStats.stats.nuevosUpsells}
                  percentage={campaignStats.summary.tasaUpsell}
                  color="text-orange-600"
                  bgColor="bg-gradient-to-br from-orange-500 to-orange-600"
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

              {/* Cambios de estado */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  Cambios de Estado
                </h3>
                {Object.keys(campaignStats.estadosComparison).length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">📊</div>
                    <p className="text-gray-500 dark:text-gray-400">No se detectaron cambios de estado</p>
                    <p className="text-xs text-gray-400 mt-1">Los usuarios mantuvieron sus estados iniciales</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(campaignStats.estadosComparison)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 10)
                      .map(([transition, count]) => (
                        <div key={transition} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 rounded-lg border border-gray-100 dark:border-gray-600">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{transition}</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-xs">{count}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Resumen de rendimiento */}
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <BarChart3 className="h-6 w-6 mr-2" />
                  Resumen de Rendimiento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                    <div className="text-3xl font-bold text-white mb-1">{campaignStats.summary.tasaRespuesta}</div>
                    <div className="text-white/80 text-sm font-medium">Tasa de Respuesta</div>
                    <div className="text-white/60 text-xs mt-1">📱 Interacciones detectadas</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                    <div className="text-3xl font-bold text-white mb-1">{campaignStats.summary.tasaConversion}</div>
                    <div className="text-white/80 text-sm font-medium">Tasa de Conversión</div>
                    <div className="text-white/60 text-xs mt-1">💳 Nuevos pagos registrados</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                    <div className="text-3xl font-bold text-white mb-1">{campaignStats.summary.tasaUpsell}</div>
                    <div className="text-white/80 text-sm font-medium">Tasa de Upsell</div>
                    <div className="text-white/60 text-xs mt-1">🚀 Ventas adicionales</div>
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