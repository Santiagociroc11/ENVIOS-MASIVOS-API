import React, { useState, useEffect } from 'react';
import { Send, Users, CheckCircle2, XCircle, Clock, Eye, MessageCircle, Calendar, Database, TrendingUp, BarChart3 } from 'lucide-react';
import { fetchCampaigns, fetchCampaignDetails } from '../api/services';

interface Campaign {
  _id: string;
  name: string;
  templateName: string;
  templateLanguage: string;
  databases: string[];
  totalSent: number;
  totalSuccess: number;
  totalFailed: number;
  createdAt: string;
  completedAt?: string;
  createdBy: string;
}

interface CampaignDetails {
  campaign: Campaign;
  userStats: {
    total: number;
    byEstado: { [key: string]: number };
    byMedio: { [key: string]: number };
    enviado: number;
    noEnviado: number;
  };
}

interface CampaignHistoryProps {
  selectedDatabases: string[];
}

const CampaignHistory: React.FC<CampaignHistoryProps> = ({ selectedDatabases }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignDetails | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data = await fetchCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (campaign: Campaign) => {
    setLoadingDetails(true);
    try {
      const details = await fetchCampaignDetails(campaign._id);
      if (details) {
        setSelectedCampaign(details);
        setShowDetails(true);
      }
    } catch (error) {
      console.error('Error loading campaign details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Cargando historial de campañas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl p-6 border border-gray-200/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Historial de Campañas</h2>
              <p className="text-gray-600 dark:text-gray-300">Revisa tus envíos masivos y su estado actual</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total de Campañas</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{campaigns.length}</p>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl border border-gray-200/20 overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay campañas</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Aún no has realizado ningún envío masivo. Ve a la pestaña "Enviar Mensajes" para crear tu primera campaña.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Campaña
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Plantilla
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Bases de Datos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Enviados
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Éxito/Error
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {campaigns.map((campaign) => (
                  <tr key={campaign._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {campaign.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {campaign.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {campaign._id.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{campaign.templateName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{campaign.templateLanguage}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Database className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {campaign.databases.length} BD{campaign.databases.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {campaign.totalSent.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                            {campaign.totalSuccess}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                            {campaign.totalFailed}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(campaign.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        campaign.completedAt 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                      }`}>
                        {campaign.completedAt ? 'Completada' : 'En Progreso'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(campaign)}
                        disabled={loadingDetails}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                      >
                        {loadingDetails ? 'Cargando...' : 'Ver Detalles'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-6 h-6" />
                  <div>
                    <h2 className="text-xl font-bold">{selectedCampaign.campaign.name}</h2>
                    <p className="text-purple-100">Detalles de la campaña y estado actual</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* Campaign Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">📋 Información de Campaña</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Plantilla:</span> {selectedCampaign.campaign.templateName}</div>
                    <div><span className="font-medium">Idioma:</span> {selectedCampaign.campaign.templateLanguage}</div>
                    <div><span className="font-medium">Bases de Datos:</span> {selectedCampaign.campaign.databases.join(', ')}</div>
                    <div><span className="font-medium">Creada:</span> {formatDate(selectedCampaign.campaign.createdAt)}</div>
                    {selectedCampaign.campaign.completedAt && (
                      <div><span className="font-medium">Completada:</span> {formatDate(selectedCampaign.campaign.completedAt)}</div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">📊 Estadísticas de Envío</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Enviados:</span>
                      <span className="font-bold text-blue-600">{selectedCampaign.campaign.totalSent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Exitosos:</span>
                      <span className="font-bold text-green-600">{selectedCampaign.campaign.totalSuccess}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fallidos:</span>
                      <span className="font-bold text-red-600">{selectedCampaign.campaign.totalFailed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tasa de Éxito:</span>
                      <span className="font-bold text-purple-600">
                        {selectedCampaign.campaign.totalSent > 0 
                          ? Math.round((selectedCampaign.campaign.totalSuccess / selectedCampaign.campaign.totalSent) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current User Stats */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📈 Estado Actual de Usuarios</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* By Estado */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Por Estado</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedCampaign.userStats.byEstado).map(([estado, count]) => (
                        <div key={estado} className="flex justify-between text-sm">
                          <span className="capitalize">{estado}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* By Medio */}
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Por Método de Pago</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedCampaign.userStats.byMedio).map(([medio, count]) => (
                        <div key={medio} className="flex justify-between text-sm">
                          <span className="capitalize">{medio}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enviado Status */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Estado de Campo "Enviado"</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedCampaign.userStats.enviado}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Con enviado = true</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{selectedCampaign.userStats.noEnviado}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Con enviado = false</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-900 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowDetails(false)}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
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

export default CampaignHistory;