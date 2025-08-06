import React, { useState, useEffect } from 'react';
import { Send, Users, CheckCircle2, XCircle, Eye, Calendar, Database, TrendingUp, BarChart3, Settings, Trash } from 'lucide-react';
import { fetchCampaignDetails, fetchCampaignsList, fixCampaignPlantillaFields, cleanupCampaignUsers } from '../api/services';

interface Campaign {
  campaignId: string;  // ← CAMBIO: usar campaignId string como StatsPanel
  templateName: string;
  sentAt: string;      // ← CAMBIO: sentAt en lugar de createdAt
  totalSent: number;
  databases: string[];
  notes?: string;
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

const CampaignHistory: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignDetails | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [fixingCampaign, setFixingCampaign] = useState<string | null>(null);
  const [cleaningCampaign, setCleaningCampaign] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      // ✅ CAMBIO: usar la misma fuente que StatsPanel
      const response = await fetchCampaignsList(1, 100); // Obtener todas las campañas
      setCampaigns(response.campaigns || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (campaign: Campaign) => {
    setLoadingDetails(true);
    try {
      const details = await fetchCampaignDetails(campaign.campaignId);
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

  const handleFixPlantillaFields = async (campaign: Campaign) => {
    if (!confirm(`¿Estás seguro de que quieres reparar la campaña "${campaign.campaignId}"?\n\nEsto actualizará:\n• plantilla_at y plantilla_enviada\n• flag_masivo para usuarios con cambios de estado\n• respondio_masivo = true para quien cambió de estado\n• respondio_masivo_at (10 seg después del envío)\n\nLa reparación ayudará a que las estadísticas sean más precisas.`)) {
      return;
    }

    setFixingCampaign(campaign.campaignId);
    try {
      console.log('🔧 Iniciando reparación de campos plantilla para campaña:', campaign.campaignId);
      
      // ✅ CAMBIO: pasar campaignId en lugar de _id
      const result = await fixCampaignPlantillaFields(campaign.campaignId);
      
      console.log('✅ Reparación completada:', result);
      
      // Show success message with details
      alert(`✅ Reparación completada exitosamente!\n\n` +
            `📋 Campaña: ${result.campaign.campaignId}\n` +
            `🎯 Plantilla: ${result.campaign.templateName}\n` +
            `📊 Método: ${result.hasSnapshots ? 'Con snapshots de estado' : 'Detección de interacción'}\n\n` +
            `📊 Resumen:\n` +
            `• Total procesados: ${result.summary.total}\n` +
            `• Actualizados: ${result.summary.updated}\n` +
            `• Flags masivos agregados: ${result.summary.flagMasivoUpdated || 0}\n` +
            `• respondio_masivo agregados: ${result.summary.respondioMasivoUpdated || 0}\n` +
            `• respondio_masivo_at agregados: ${result.summary.respondioMasivoAtUpdated || 0}\n` +
            `• Total candidatos flag_masivo: ${result.summary.totalFlagMasivoCandidates || 0}\n` +
            `• Omitidos: ${result.summary.skipped}\n` +
            `• Errores: ${result.summary.errors}\n\n` +
            `Los usuarios ahora tienen:\n` +
            `✓ plantilla_at y plantilla_enviada actualizados\n` +
            `✓ flag_masivo agregado para usuarios con cambios detectados\n\n` +
            `Esto mejorará la precisión de las estadísticas de campaña.`);
            
    } catch (error: any) {
      console.error('❌ Error fixing campaign fields:', error);
      alert(`❌ Error al reparar la campaña:\n\n${error.message}\n\nRevisa la consola para más detalles.`);
    } finally {
      setFixingCampaign(null);
    }
  };

  const handleCleanupCampaign = async (campaign: Campaign) => {
    if (!confirm(`🧹 ¿Limpiar campaña "${campaign.campaignId}"?\n\n⚠️ ATENCIÓN: Esta acción:\n\n✅ MANTENDRÁ a los usuarios que respondieron (con flag_masivo)\n❌ ELIMINARÁ de la campaña a usuarios sin respuesta\n🗑️ LIMPIARÁ el flag_masivo de esos usuarios en la BD\n📊 ACTUALIZARÁ las estadísticas de la campaña\n\n🎯 Esto liberará a los usuarios no respondieron para futuros envíos.\n\n¿Continuar con la limpieza?`)) {
      return;
    }

    setCleaningCampaign(campaign.campaignId);
    try {
      console.log('🧹 Iniciando limpieza de campaña:', campaign.campaignId);
      
      const result = await cleanupCampaignUsers(campaign.campaignId);
      
      console.log('✅ Limpieza completada:', result);
      
      // Show success message with details
      alert(`✅ Limpieza completada exitosamente!\n\n` +
            `📋 Campaña: ${result.campaignId}\n` +
            `📊 Resultado:\n\n` +
            `👥 Usuarios originales: ${result.originalTotalSent}\n` +
            `✅ Mantenidos (respondieron): ${result.usersKept}\n` +
            `🗑️ Eliminados (sin respuesta): ${result.usersRemoved}\n` +
            `📈 Nuevo total: ${result.newTotalSent}\n` +
            `📊 Porcentaje mantenido: ${result.summary.percentageKept}%\n\n` +
            `🎯 Los ${result.usersRemoved} usuarios eliminados:\n` +
            `• Ya no aparecen en esta campaña\n` +
            `• Fueron limpiados en la base de datos\n` +
            `• Están disponibles para futuros envíos\n\n` +
            `Los ${result.usersKept} usuarios que respondieron se mantienen registrados.`);
      
      // Reload campaigns to see updated stats
      loadCampaigns();
            
    } catch (error: any) {
      console.error('❌ Error cleaning up campaign:', error);
      alert(`❌ Error al limpiar la campaña:\n\n${error.message}\n\nRevisa la consola para más detalles.`);
    } finally {
      setCleaningCampaign(null);
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
                  <tr key={campaign.campaignId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {campaign.templateName.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {campaign.campaignId}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Template: {campaign.templateName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{campaign.templateName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{campaign.databases.join(', ')}</div>
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
                          {campaign.totalSent?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                                              <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                            {campaign.totalSent || 0}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                            0
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(campaign.sentAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                        Completada
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleViewDetails(campaign)}
                          disabled={loadingDetails}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                        >
                          <Eye className="w-4 h-4" />
                          <span>{loadingDetails ? 'Cargando...' : 'Ver Detalles'}</span>
                        </button>
                        
                        <button
                          onClick={() => handleFixPlantillaFields(campaign)}
                          disabled={fixingCampaign === campaign.campaignId}
                          className="flex items-center space-x-1 text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50"
                          title="Reparar campos: plantilla_at, plantilla_enviada, flag_masivo, respondio_masivo y respondio_masivo_at"
                        >
                          <Settings className="w-4 h-4" />
                          <span>{fixingCampaign === campaign.campaignId ? 'Reparando...' : 'Reparar'}</span>
                        </button>
                        
                        <button
                          onClick={() => handleCleanupCampaign(campaign)}
                          disabled={cleaningCampaign === campaign.campaignId}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          title="Limpiar campaña: Mantener solo usuarios que respondieron y liberar el resto para nuevos envíos"
                        >
                          <Trash className="w-4 h-4" />
                          <span>{cleaningCampaign === campaign.campaignId ? 'Limpiando...' : 'Limpiar'}</span>
                        </button>
                      </div>
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
                    <h2 className="text-xl font-bold">{selectedCampaign.campaign.campaignId}</h2>
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
                    <div><span className="font-medium">Bases de Datos:</span> {selectedCampaign.campaign.databases.join(', ')}</div>
                    <div><span className="font-medium">Enviada:</span> {formatDate(selectedCampaign.campaign.sentAt)}</div>
                    <div><span className="font-medium">Estado:</span> Completada</div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">📊 Estadísticas de Envío</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Enviados:</span>
                      <span className="font-bold text-blue-600">{selectedCampaign.campaign.totalSent || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Exitosos:</span>
                      <span className="font-bold text-green-600">{selectedCampaign.campaign.totalSent || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fallidos:</span>
                      <span className="font-bold text-red-600">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tasa de Éxito:</span>
                      <span className="font-bold text-purple-600">100%</span>
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