import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, MessageCircle, CreditCard, Eye, Trash2, Calendar, Database } from 'lucide-react';
import { fetchCampaignsList, fetchCampaignStats, deleteCampaignStats } from '../api/services';

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
      const response = await fetchCampaignsList(currentPage, 10);
      setCampaigns(response.campaigns);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading campaigns:', error);
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

  const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; color: string }> = 
    ({ icon, title, value, color }) => (
      <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 ${color}`}>
        <div className="flex items-center">
          <div className="mr-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <BarChart3 className="mr-3 h-8 w-8 text-blue-600" />
          Estadísticas de Campañas
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Analiza el rendimiento de tus campañas de envío masivo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de Campañas */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Campañas Recientes
              </h2>
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
                  icon={<Users className="h-6 w-6 text-blue-600" />}
                  title="Total Enviados"
                  value={campaignStats.stats.totalEnviados}
                  color="border-blue-500"
                />
                <StatCard
                  icon={<MessageCircle className="h-6 w-6 text-green-600" />}
                  title="Respondieron"
                  value={`${campaignStats.stats.respondieron} (${campaignStats.summary.tasaRespuesta})`}
                  color="border-green-500"
                />
                <StatCard
                  icon={<CreditCard className="h-6 w-6 text-purple-600" />}
                  title="Nuevos Pagos"
                  value={`${campaignStats.stats.nuevasPagados} (${campaignStats.summary.tasaConversion})`}
                  color="border-purple-500"
                />
                <StatCard
                  icon={<TrendingUp className="h-6 w-6 text-orange-600" />}
                  title="Upsells"
                  value={`${campaignStats.stats.nuevosUpsells} (${campaignStats.summary.tasaUpsell})`}
                  color="border-orange-500"
                />
              </div>

              {/* Cambios de estado */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Cambios de Estado
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(campaignStats.estadosComparison)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([transition, count]) => (
                      <div key={transition} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{transition}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Resumen de rendimiento */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  📊 Resumen de Rendimiento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{campaignStats.summary.tasaRespuesta}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tasa de Respuesta</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{campaignStats.summary.tasaConversion}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tasa de Conversión</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{campaignStats.summary.tasaUpsell}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tasa de Upsell</p>
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