import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle2, XCircle, Clock, Search, Filter, RefreshCw, Eye, MessageCircle, Phone } from 'lucide-react';

interface MessageRecord {
  _id: string;
  whatsapp: string;
  templateName: string;
  sentAt: Date;
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
  response?: string;
  responseAt?: Date;
  error?: string;
  database: string;
}

interface MessageHistoryProps {
  selectedDatabases: string[];
}

const MessageHistory: React.FC<MessageHistoryProps> = ({ selectedDatabases }) => {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<MessageRecord | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // Mock data for demonstration - replace with actual API call
  const mockMessages: MessageRecord[] = [
    {
      _id: '1',
      whatsapp: '573136298562',
      templateName: 'payment_reminder',
      sentAt: new Date('2024-01-15T10:30:00'),
      status: 'replied',
      response: 'Hola, ya realicé el pago. ¿Podrían confirmar?',
      responseAt: new Date('2024-01-15T11:45:00'),
      database: 'bot-win-2'
    },
    {
      _id: '2',
      whatsapp: '573145678901',
      templateName: 'payment_reminder',
      sentAt: new Date('2024-01-15T10:31:00'),
      status: 'read',
      database: 'bot-win-2'
    },
    {
      _id: '3',
      whatsapp: '573156789012',
      templateName: 'payment_reminder',
      sentAt: new Date('2024-01-15T10:32:00'),
      status: 'delivered',
      database: 'bot-win-2'
    },
    {
      _id: '4',
      whatsapp: '573167890123',
      templateName: 'payment_reminder',
      sentAt: new Date('2024-01-15T10:33:00'),
      status: 'failed',
      error: 'Número no válido',
      database: 'bot-win-2'
    },
    {
      _id: '5',
      whatsapp: '573178901234',
      templateName: 'payment_reminder',
      sentAt: new Date('2024-01-15T10:34:00'),
      status: 'replied',
      response: '¡Perfecto! Muchas gracias por el recordatorio. Ya pagué.',
      responseAt: new Date('2024-01-15T12:20:00'),
      database: 'bot-win-2'
    }
  ];

  useEffect(() => {
    loadMessageHistory();
  }, [selectedDatabases]);

  const loadMessageHistory = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetchMessageHistory(selectedDatabases);
      // setMessages(response.messages);
      
      // Using mock data for now
      setTimeout(() => {
        setMessages(mockMessages);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading message history:', error);
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.whatsapp.includes(searchTerm) || 
                         message.templateName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'read':
        return <Eye className="w-4 h-4 text-purple-500" />;
      case 'replied':
        return <MessageCircle className="w-4 h-4 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'read':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'replied':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'read': return 'Leído';
      case 'replied': return 'Respondió';
      case 'failed': return 'Falló';
      default: return 'Desconocido';
    }
  };

  const handleViewDetails = (message: MessageRecord) => {
    setSelectedMessage(message);
    setShowDetails(true);
  };

  const stats = {
    total: filteredMessages.length,
    sent: filteredMessages.filter(m => m.status === 'sent').length,
    delivered: filteredMessages.filter(m => m.status === 'delivered').length,
    read: filteredMessages.filter(m => m.status === 'read').length,
    replied: filteredMessages.filter(m => m.status === 'replied').length,
    failed: filteredMessages.filter(m => m.status === 'failed').length
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200/20">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200/20">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Enviados</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200/20">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Entregados</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200/20">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Leídos</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.read}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200/20">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Respondieron</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.replied}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200/20">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Fallaron</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl p-6 border border-gray-200/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 flex-1">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 text-sm"
                placeholder="Buscar por número o plantilla..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3 text-sm"
              >
                <option value="all">Todos los Estados</option>
                <option value="sent">Enviados</option>
                <option value="delivered">Entregados</option>
                <option value="read">Leídos</option>
                <option value="replied">Respondieron</option>
                <option value="failed">Fallaron</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={loadMessageHistory}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl border border-gray-200/20 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Cargando historial de mensajes...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay mensajes</h3>
            <p className="text-gray-500 dark:text-gray-400">
              No se encontraron mensajes que coincidan con tus criterios de búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Plantilla
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Enviado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Respuesta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMessages.map((message) => (
                  <tr key={message._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {message.whatsapp.slice(-2)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {message.whatsapp}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {message.database}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{message.templateName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                        {getStatusIcon(message.status)}
                        <span className="ml-1">{getStatusLabel(message.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {message.sentAt.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {message.response ? (
                        <div className="text-sm">
                          <div className="text-gray-900 dark:text-white truncate max-w-xs">
                            {message.response}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {message.responseAt?.toLocaleString()}
                          </div>
                        </div>
                      ) : message.error ? (
                        <div className="text-sm text-red-600 dark:text-red-400">
                          {message.error}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(message)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Ver detalles
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
      {showDetails && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Phone className="w-6 h-6" />
                  <div>
                    <h2 className="text-xl font-bold">Detalles del Mensaje</h2>
                    <p className="text-blue-100">{selectedMessage.whatsapp}</p>
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

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plantilla
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    {selectedMessage.templateName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedMessage.status)}`}>
                    {getStatusIcon(selectedMessage.status)}
                    <span className="ml-1">{getStatusLabel(selectedMessage.status)}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enviado
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedMessage.sentAt.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Base de Datos
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedMessage.database}
                  </p>
                </div>
              </div>

              {selectedMessage.response && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Respuesta del Usuario
                  </label>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm text-gray-900 dark:text-white mb-2">
                      {selectedMessage.response}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Respondió el {selectedMessage.responseAt?.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {selectedMessage.error && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Error
                  </label>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {selectedMessage.error}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowDetails(false)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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

export default MessageHistory;