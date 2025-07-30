// src/components/Modals/ConfirmDeleteModal.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import { 
  Trash2,
  AlertTriangle,
  Package,
  Pill,
  Loader,
  X
} from 'lucide-react';
import Modal from '../UI/Modal';
import { deleteStockById } from '../../api/api';

const ConfirmDeleteModal = ({ isOpen, onClose, stockItem, onSuccess }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setError('');
    }
  }, [isOpen]);

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      await deleteStockById(stockItem._id);
      onSuccess(stockItem._id);
      onClose();
    } catch (error) {
      console.error('Delete stock error:', error);
      setError(error.response?.data?.message || 'Failed to delete stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!stockItem) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete Stock Batch"
      subtitle="This action cannot be undone"
    >
      <div className="p-6 space-y-6">
        {/* Warning Header */}
        <div className="text-center">
          <div className="inline-flex p-4 rounded-full bg-red-500 bg-opacity-20 border border-red-500 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-2`}>
            Are you sure you want to delete this stock batch?
          </h3>
          {/* <p className={`text-sm ${theme.textMuted}`}>
            This action is permanent and cannot be undone
          </p> */}
        </div>

        {/* Stock Information */}
        <div className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}>
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${theme.cardOpacity} border ${theme.borderSecondary}`}>
              <Pill className={`w-6 h-6 text-emerald-500`} />
            </div>
            <div className="flex-1">
              <h4 className={`font-semibold ${theme.textPrimary}`}>
                Batch: {stockItem.batchNumber}
              </h4>
              {/* <p className={`text-sm ${theme.textMuted}`}>
                Form: <span className="capitalize">{stockItem.form}</span>
              </p>
              <p className={`text-sm ${theme.textSecondary}`}>
                Batch: {stockItem.batchNumber}
              </p> */}
            </div>
            {/* <div className="text-right">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                stockItem.stockLevel > 50
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : stockItem.stockLevel > 10 
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {stockItem.stockLevel} units
              </span>
            </div> */}
          </div>
        </div>

        {/* Warning Message */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start space-x-3 p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-200">
              Warning: This action is irreversible
            </p>
            <ul className="text-sm text-red-700 dark:text-red-300 mt-2 space-y-1">
              <li>• This stock batch will be permanently deleted</li>
              <li>• The stock level will be reduced accordingly</li>
              <li>• This action is permanent and cannot be undone</li>
            </ul>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-200"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className={`px-6 py-3 ${theme.cardSecondary} ${theme.textSecondary} rounded-lg hover:bg-opacity-70 transition-colors`}
            disabled={loading}
          >
            Cancel
          </button>
          <motion.button
            onClick={handleDelete}
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className={`flex items-center space-x-2 px-6 py-3 font-medium rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              loading
                ? `${theme.cardSecondary} ${theme.textSecondary}`
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
            }`}
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                <span>Delete Batch</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;