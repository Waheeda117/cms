import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import { 
  Trash2,
  AlertTriangle,
  User,
  Stethoscope,
  UserCheck,
  Package,
  Pill,
  Loader,
  X
} from 'lucide-react';
import Modal from '../../components/UI/Modal';
import { deleteUserByRoleAndId } from '../../api/api'; // Direct import instead of dynamic import

const DeleteConfirmationModal = ({ isOpen, onClose, userData, onSuccess }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setError('');
    }
  }, [isOpen]);

const getRoleIcon = (role) => {
  const roleIcons = {
    doctor: Stethoscope,
    receptionist: UserCheck,
    pharmacist_dispenser: Pill,
    pharmacist_inventory: Package,
    pharmacist_inventory_staff: Package,
  };
  return roleIcons[role] || User;
};


const getRoleColor = (role) => {
  const roleColors = {
    doctor: 'text-purple-500',
    receptionist: 'text-blue-500',
    pharmacist_dispenser: 'text-green-500',
    pharmacist_inventory: 'text-orange-500',
    pharmacist_inventory_staff: 'text-teal-500',
  };
  return roleColors[role] || 'text-gray-500';
};

const formatRoleName = (role) => {
  const roleNames = {
    doctor: 'Medical Doctor',
    receptionist: 'Receptionist',
    pharmacist_dispenser: 'Pharmacy Dispenser',
    pharmacist_inventory: 'Inventory Pharmacist',
    pharmacist_inventory_staff: 'Inventory Staff',
  };
  return roleNames[role] || role;
};

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      await deleteUserByRoleAndId(userData.role, userData._id);

      // Call success callback
      onSuccess(userData);
      
      // Close modal after successful deletion
      onClose();
      resetForm();

    } catch (error) {
      console.error('Delete error:', error);
      setError(error.response?.data?.message || 'Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!userData) return null;

  const RoleIcon = getRoleIcon(userData.role);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete User Account"
      subtitle="This action cannot be undone"
    >
      <div className="p-6 space-y-6">
        {/* Warning Header */}
        <div className="text-center">
          <div className="inline-flex p-4 rounded-full bg-red-500 bg-opacity-20 border border-red-500 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-2`}>
            Are you sure you want to delete this user?
          </h3>
          <p className={`text-sm ${theme.textMuted}`}>
            This action is permanent and cannot be undone
          </p>
        </div>

        {/* User Information */}
        <div className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}>
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${theme.cardOpacity} border ${theme.borderSecondary}`}>
              <RoleIcon className={`w-6 h-6 ${getRoleColor(userData.role)}`} />
            </div>
            <div className="flex-1">
              <h4 className={`font-semibold ${theme.textPrimary}`}>
                {userData.name}
              </h4>
              <p className={`text-sm ${theme.textMuted}`}>
                {formatRoleName(userData.role)}
              </p>
              <p className={`text-sm ${theme.textSecondary}`}>
                {userData.email}
              </p>
            </div>
            <div className="text-right">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                userData.isActive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {userData.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
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
              <li>• All user data will be permanently deleted</li>
              <li>• User will lose access to the system immediately</li>
              <li>• This action cannot be undone</li>
              <li>• All associated records will be removed</li>
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
        <div className="flex justify-end space-x-4 pt-6">
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
                <span>Delete User</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;