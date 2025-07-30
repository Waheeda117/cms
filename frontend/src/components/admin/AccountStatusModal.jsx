import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import { 
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  Save,
  User
} from 'lucide-react';
import Modal from '../../components/UI/Modal';

const AccountStatusModal = ({ isOpen, onClose, userData, onSuccess }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newStatus, setNewStatus] = useState(userData?.isActive || false);
  const [reason, setReason] = useState('');

  React.useEffect(() => {
    if (userData) {
      setNewStatus(userData.isActive);
      setReason('');
      setError('');
      setSuccess('');
    }
  }, [userData]);

  const handleStatusChange = (status) => {
    setNewStatus(status);
    if (error) setError('');
  };

//   const validateForm = () => {
//     if (!newStatus && userData?.isActive) {
//       setError('Please provide a reason for deactivating this account');
//       return false;
//     }
//     return true;
//   };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Import the update function - you'll need to create this API endpoint
      const { updateUserAccountStatus } = await import('../../api/api');
      
      const updateData = {
        isActive: newStatus,
        // ...(reason.trim() && { statusChangeReason: reason.trim() })
      };

      const response = await updateUserAccountStatus(userData.role, userData._id, updateData);

      setSuccess(`Account ${newStatus ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => {
        onSuccess(response.user); // Pass updated user data back
        onClose();
        resetForm();
      }, 1500);

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update account status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setReason('');
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    // Reset to original status when closing without saving
    if (userData) {
      setNewStatus(userData.isActive);
    }
    resetForm();
    onClose();
  };

  const getRoleIcon = (role) => {
    const roleIcons = {
      admin: Shield,
      doctor: Shield,
      receptionist: User,
      pharmacist_dispenser: User,
      pharmacist_inventory: User,
    };
    return roleIcons[role] || User;
  };

  const getRoleColor = (role) => {
    const roleColors = {
      admin: 'text-red-500',
      doctor: 'text-purple-500',
      receptionist: 'text-blue-500',
      pharmacist_dispenser: 'text-green-500',
      pharmacist_inventory: 'text-orange-500',
    };
    return roleColors[role] || 'text-gray-500';
  };

  const formatRoleName = (role) => {
    const roleNames = {
      admin: 'Administrator',
      doctor: 'Medical Doctor',
      receptionist: 'Receptionist',
      pharmacist_dispenser: 'Pharmacy Dispenser',
      pharmacist_inventory: 'Inventory Pharmacist',
    };
    return roleNames[role] || role;
  };

  if (!userData) return null;

  const RoleIcon = getRoleIcon(userData.role);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Manage Account Status"
      subtitle={`Update account status for ${userData.name}`}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Header Section */}
        <div className="text-center">
          <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${theme.buttonGradient} bg-opacity-20 mb-4`}>
            <RoleIcon className={`w-8 h-8 ${getRoleColor(userData.role)}`} />
          </div>
          <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
            {userData.name}
          </h3>
          <p className={`text-sm ${theme.textMuted}`}>
            {formatRoleName(userData.role)}
          </p>
        </div>

        {/* Current Status Display */}
        <div className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${theme.textSecondary}`}>
              Current Status
            </span>
            <div className="flex items-center space-x-2">
              {userData.isActive ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-medium text-sm">Active</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-500 font-medium text-sm">Inactive</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
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

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg dark:bg-green-900 dark:border-green-700 dark:text-green-200"
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}

        {/* Status Selection */}
        <div>
          <label className={`block text-sm font-medium ${theme.textSecondary} mb-3`}>
            Account Status
          </label>
          <div className="space-y-3">
            {/* Active Option */}
            <motion.label
              whileHover={{ scale: 1.02 }}
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                newStatus
                  ? `border-green-500 bg-green-50 dark:bg-green-900/20`
                  : `border-gray-200 dark:border-gray-700 ${theme.cardSecondary}`
              }`}
            >
              <input
                type="radio"
                name="accountStatus"
                checked={newStatus === true}
                onChange={() => handleStatusChange(true)}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <div className="ml-3 flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-500 bg-opacity-20 border border-green-500">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className={`font-medium ${theme.textMuted}`}>Active</p>
                  <p className={`text-sm ${theme.textMuted}`}>
                    User can access the system and perform their role functions
                  </p>
                </div>
              </div>
            </motion.label>

            {/* Inactive Option */}
            <motion.label
              whileHover={{ scale: 1.02 }}
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                !newStatus
                  ? `border-red-500 bg-red-50 dark:bg-red-900/20`
                  : `border-gray-200 dark:border-gray-700 ${theme.cardSecondary}`
              }`}
            >
              <input
                type="radio"
                name="accountStatus"
                checked={newStatus === false}
                onChange={() => handleStatusChange(false)}
                className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
              />
              <div className="ml-3 flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-red-500 bg-opacity-20 border border-red-500">
                  <XCircle className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className={`font-medium ${theme.textMuted}`}>Inactive</p>
                  <p className={`text-sm ${theme.textMuted}`}>
                    User access will be suspended and login will be disabled
                  </p>
                </div>
              </div>
            </motion.label>
          </div>
        </div>

        {/* Reason Field (shown when changing to inactive or when currently inactive) */}
        {/* {(!newStatus || (userData.isActive && !newStatus)) && (
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
              Reason {userData.isActive && !newStatus ? '*' : ''}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200 resize-none`}
              placeholder={
                !newStatus 
                  ? "Provide a reason for this status change..."
                  : "Optional: Add any additional notes..."
              }
              required={userData.isActive && !newStatus}
            />
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              {userData.isActive && !newStatus 
                ? "Required: Explain why this account is being deactivated"
                : "Optional: This information will be logged for future reference"
              }
            </p>
          </div>
        )} */}

        {/* Warning for Status Change */}
        {newStatus !== userData.isActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start space-x-3 p-4 rounded-lg ${
              newStatus ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                        : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
            }`}
          >
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              newStatus ? 'text-green-600' : 'text-red-600'
            }`} />
            <div>
              <p className={`font-medium ${
                newStatus ? 'text-green-800 dark:text-green-200' 
                          : 'text-red-800 dark:text-red-200'
              }`}>
                {newStatus ? 'Account Activation' : 'Account Deactivation'}
              </p>
              <p className={`text-sm ${
                newStatus ? 'text-green-700 dark:text-green-300' 
                          : 'text-red-700 dark:text-red-300'
              }`}>
                {newStatus 
                  ? 'This user will regain access to the system and can perform their role functions.'
                  : 'This user will lose access to the system immediately and will not be able to log in.'
                }
              </p>
            </div>
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
            type="submit"
            disabled={loading || newStatus === userData.isActive}
            whileHover={{ scale: loading || newStatus === userData.isActive ? 1 : 1.02 }}
            whileTap={{ scale: loading || newStatus === userData.isActive ? 1 : 0.98 }}
            className={`flex items-center space-x-2 px-6 py-3 font-medium rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              newStatus === userData.isActive 
                ? `${theme.cardSecondary} ${theme.textSecondary}`
                : `bg-gradient-to-r ${theme.buttonGradient} text-white ${theme.buttonGradientHover}`
            }`}
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>
                  {newStatus === userData.isActive 
                    ? 'No Changes' 
                    : `${newStatus ? 'Activate' : 'Deactivate'} Account`
                  }
                </span>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
};

export default AccountStatusModal;