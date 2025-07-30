import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const Modal = ({ isOpen, onClose, children, title, subtitle }) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full max-w-2xl max-h-[90vh] mx-4 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border shadow-2xl overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`px-6 py-4 ${theme.borderSecondary} border-b`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-xl font-bold ${theme.textPrimary}`}>{title}</h2>
                {subtitle && <p className={`text-sm ${theme.textMuted} mt-1`}>{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg ${theme.textPrimary} ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Modal;