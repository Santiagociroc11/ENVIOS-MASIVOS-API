import React from 'react';
import { User } from '../types';
import { formatDistanceToNow } from '../utils/dateUtils';

interface UserListProps {
  users: User[];
  selectedUsers: string[];
  onToggleSelection: (whatsapp: string) => void;
}

const UserList: React.FC<UserListProps> = ({ users, selectedUsers, onToggleSelection }) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">🔍 No se encontraron usuarios</h3>
        <p className="text-gray-500 dark:text-gray-400">Ningún usuario coincide con tus criterios de búsqueda actuales. Intenta ajustar tus filtros.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200/20">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span>Seleccionar</span>
                </div>
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                📱 Número WhatsApp
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                📊 Estado
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                💳 Método de Pago
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                ⏰ Tiempo Desde Solicitud
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                ✉️ Enviado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-700">
            {users.map((user, index) => (
              <tr key={user._id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-200">
                <td className="px-6 py-5 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 transition-all duration-200 hover:scale-110"
                    checked={selectedUsers.includes(user.whatsapp)}
                    onChange={() => onToggleSelection(user.whatsapp)}
                  />
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user.whatsapp.slice(-2)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{user.whatsapp}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">#{index + 1}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm ${
                    user.estado === 'medio-enviado' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 dark:from-yellow-800 dark:to-yellow-700 dark:text-yellow-100' :
                    user.estado === 'nequi' ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 dark:from-purple-800 dark:to-purple-700 dark:text-purple-100' :
                    user.estado === 'bancolombia' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-800 dark:to-blue-700 dark:text-blue-100' :
                    user.estado === 'daviplata' ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 dark:from-red-800 dark:to-red-700 dark:text-red-100' :
                    'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300'
                  }`}>
                    {user.estado}
                  </span>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{user.medio || 'No especificado'}</span>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {user.medio_at ? formatDistanceToNow(user.medio_at) : 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    user.enviado 
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-800 dark:to-emerald-800 dark:text-green-100' 
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300'
                  }`}>
                    {user.enviado ? '✅ Sí' : '❌ No'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;