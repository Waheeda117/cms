// components/dashboard/LowStockAlerts.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronRight, Pill } from 'lucide-react';

const LowStockAlerts = ({ theme }) => {
  const medicines = [
    { id: 1, name: 'Amoxicillin 500mg', current: 12, min: 50, status: 'critical' },
    { id: 2, name: 'Paracetamol 500mg', current: 42, min: 100, status: 'warning' },
    { id: 3, name: 'Omeprazole 20mg', current: 28, min: 50, status: 'critical' },
    { id: 4, name: 'Atorvastatin 40mg', current: 65, min: 100, status: 'warning' },
    { id: 5, name: 'Metformin 500mg', current: 38, min: 50, status: 'critical' },
  ];

  const getStatusColor = (status) => {
    return status === 'critical' 
      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
    >
      <div className="flex flex-col sm:flex-row gap-5 justify-between mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-1`}>
            Low Stock Alerts
          </h2>
          <p className={`text-sm ${theme.textMuted}`}>
            Medicines needing immediate attention
          </p>
        </div>
        <button className={`flex items-center text-sm ${theme.textSecondary} hover:${theme.textPrimary} transition-colors`}>
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      <div className="space-y-4">
        {medicines.map((medicine) => (
          <div 
            key={medicine.id}
            className={`flex items-center justify-between p-4 ${theme.cardSecondary} rounded-lg ${theme.borderSecondary} border`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-full ${getStatusColor(medicine.status)}`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`font-medium ${theme.textPrimary}`}>{medicine.name}</h3>
                <p className={`text-sm ${theme.textMuted} flex items-center`}>
                  <Pill className="w-4 h-4 mr-1" />
                  Current: {medicine.current} | Min: {medicine.min}
                </p>
              </div>
            </div>
            <div className="text-right min-w-20">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(medicine.status)}`}>
                {medicine.status === 'critical' ? 'Critical' : 'Low Stock'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default LowStockAlerts;