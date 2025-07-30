import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import Modal from '../UI/Modal';
import { useTheme } from '../../hooks/useTheme';
import { updatePassword } from '../../api/api';

const UpdatePasswordModal = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const response = await updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (response.success) {
        setSuccessMessage('Password updated successfully!');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
          setSuccessMessage('');
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update password';
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
    setSuccessMessage('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Update Password"
      subtitle="Change your account password securely"
    >
      <div className="p-6">
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg bg-green-500 bg-opacity-10 border border-green-500 border-opacity-20 flex items-center space-x-3`}
          >
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">{successMessage}</span>
          </motion.div>
        )}

        {errors.submit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg bg-red-500 bg-opacity-10 border border-red-500 border-opacity-20 flex items-center space-x-3`}
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-medium">{errors.submit}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
              Current Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className={`w-5 h-5 ${theme.textMuted}`} />
              </div>
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                className={`w-full pl-10 pr-12 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200 ${errors.currentPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter your current password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                disabled={isLoading}
              >
                {showPasswords.current ? (
                  <EyeOff className={`w-5 h-5 ${theme.textMuted} hover:${theme.textSecondary}`} />
                ) : (
                  <Eye className={`w-5 h-5 ${theme.textMuted} hover:${theme.textSecondary}`} />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-400">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className={`w-5 h-5 ${theme.textMuted}`} />
              </div>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                className={`w-full pl-10 pr-12 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200 ${errors.newPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter your new password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                disabled={isLoading}
              >
                {showPasswords.new ? (
                  <EyeOff className={`w-5 h-5 ${theme.textMuted} hover:${theme.textSecondary}`} />
                ) : (
                  <Eye className={`w-5 h-5 ${theme.textMuted} hover:${theme.textSecondary}`} />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-400">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className={`w-5 h-5 ${theme.textMuted}`} />
              </div>
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full pl-10 pr-12 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Confirm your new password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                disabled={isLoading}
              >
                {showPasswords.confirm ? (
                  <EyeOff className={`w-5 h-5 ${theme.textMuted} hover:${theme.textSecondary}`} />
                ) : (
                  <Eye className={`w-5 h-5 ${theme.textMuted} hover:${theme.textSecondary}`} />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <motion.button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className={`px-6 py-3 ${theme.cardSecondary} ${theme.textSecondary} rounded-lg font-medium transition-colors hover:bg-opacity-70 disabled:opacity-50`}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-3 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader className="animate-spin w-4 h-4" />
                  <span>Updating...</span>
                </div>
              ) : (
                'Update Password'
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default UpdatePasswordModal;