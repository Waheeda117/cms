import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Key, Settings } from 'lucide-react';
import Modal from './UI/Modal';
import { useTheme } from '../hooks/useTheme';

const DefaultPasswordModal = ({ isOpen, onClose }) => {
  const { theme } = useTheme();

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Security Alert"
      subtitle="Important account security notice"
    >
      <div className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500 bg-opacity-20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
          
          <h3 className={`text-xl font-bold ${theme.textPrimary} mb-2`}>
            Default Password Detected
          </h3>
          
          <p className={`${theme.textMuted} mb-6`}>
            You are currently using the default password assigned to your account. 
            For security reasons, please change your password immediately in the 
            <span className="font-semibold"> Update Password</span> section of your account settings.
          </p>
          
          <div className="flex items-center gap-4 mb-6">
            <div className={`flex items-center gap-2 p-3 rounded-lg ${theme.cardSecondary}`}>
              <Key className="w-5 h-5 text-blue-500" />
              <span className={theme.textSecondary}>Default Password</span>
            </div>
            
            <div className="text-xl text-gray-400">→</div>
            
            <div className={`flex items-center gap-2 p-3 rounded-lg ${theme.cardSecondary}`}>
              <Settings className="w-5 h-5 text-green-500" />
              <span className={theme.textSecondary}>Update Password</span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-lg ${theme.textPrimary} font-medium ${theme.buttonPrimary}`}
          >
            I Understand
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DefaultPasswordModal;