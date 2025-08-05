import React from 'react';
import { X } from 'lucide-react';
import TestMessagePanel from './TestMessagePanel';
import { ConfiguredTemplate } from '../types';

interface TestMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplate: ConfiguredTemplate | null;
  selectedDatabases: string[];
}

const TestMessageModal: React.FC<TestMessageModalProps> = ({
  isOpen,
  onClose,
  selectedTemplate,
  selectedDatabases
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="relative inline-block w-full max-w-6xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              ⚡ Envío de Prueba
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[80vh] overflow-y-auto">
            <TestMessagePanel 
              selectedTemplate={selectedTemplate}
              selectedDatabases={selectedDatabases}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestMessageModal;