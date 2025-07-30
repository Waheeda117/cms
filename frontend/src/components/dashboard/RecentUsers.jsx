// components/dashboard/RecentUsers.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from "react-router-dom";

import { User, UserPlus, ChevronRight, Stethoscope, ClipboardList, Package } from 'lucide-react';

const RecentUsers = ({ theme }) => {

  const navigate = useNavigate();

  const users = [
    { id: 1, name: 'Dr. Sara Khan', role: 'doctor', joinDate: '2 hours ago' },
    { id: 2, name: 'Fatima Zahra', role: 'receptionist', joinDate: '5 hours ago' },
    { id: 3, name: 'Ahmed Raza', role: 'pharmacist_dispenser', joinDate: '1 day ago' },
    { id: 4, name: 'Zainab Akhtar', role: 'pharmacist_inventory', joinDate: '2 days ago' },
    { id: 5, name: 'Dr. Usman Ali', role: 'doctor', joinDate: '3 days ago' },
  ];

  const getRoleIcon = (role) => {
    switch (role) {
      case 'doctor': return <Stethoscope className="w-4 h-4" />;
      case 'receptionist': return <ClipboardList className="w-4 h-4" />;
      case 'pharmacist_dispenser': return <Package className="w-4 h-4" />;
      case 'pharmacist_inventory': return <Package className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'doctor': return 'Doctor';
      case 'receptionist': return 'Receptionist';
      case 'pharmacist_dispenser': return 'Dispenser';
      case 'pharmacist_inventory': return 'Inventory';
      default: return 'User';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'doctor': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'receptionist': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pharmacist_dispenser': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'pharmacist_inventory': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
    >
      <div className="flex flex-col sm:flex-row gap-5 justify-between mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-1`}>
            Recently Added Users
          </h2>
          <p className={`text-sm ${theme.textMuted}`}>
            New staff members added to the system
          </p>
        </div>
        <button onClick={() => navigate("/admin/user-management")} className={`flex items-center text-sm ${theme.textSecondary} hover:${theme.textPrimary} transition-colors`}>
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      <div className="space-y-4">
        {users.map((user) => (
          <div 
            key={user.id}
            className={`flex items-center justify-between p-4 ${theme.cardSecondary} rounded-lg ${theme.borderSecondary} border`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-full ${getRoleColor(user.role)}`}>
                {getRoleIcon(user.role)}
              </div>
              <div>
                <h3 className={`font-medium ${theme.textPrimary}`}>{user.name}</h3>
                <p className={`text-sm ${theme.textMuted}`}>
                  Joined {user.joinDate}
                </p>
              </div>
            </div>
            <div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default RecentUsers;