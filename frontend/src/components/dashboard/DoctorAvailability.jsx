// components/dashboard/DoctorAvailability.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { User, Clock, CheckCircle, XCircle } from 'lucide-react';

const DoctorAvailability = ({ theme }) => {
  const doctors = [
    { id: 1, name: 'Dr. Sara Khan', status: 'available', nextSlot: '10:30 AM' },
    { id: 2, name: 'Dr. Ahmed Raza', status: 'busy', nextSlot: '11:45 AM' },
    { id: 3, name: 'Dr. Ayesha Malik', status: 'available', nextSlot: '1:15 PM' },
    { id: 4, name: 'Dr. Usman Ali', status: 'away', nextSlot: '2:30 PM' },
    { id: 5, name: 'Dr. Hina Siddiqui', status: 'available', nextSlot: '3:00 PM' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'busy': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'away': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'busy': return <Clock className="w-4 h-4" />;
      case 'away': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-1`}>
            Doctor Availability
          </h2>
          <p className={`text-sm ${theme.textMuted}`}>
            Current status of medical staff
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {doctors.map((doctor) => (
          <div 
            key={doctor.id}
            className={`flex items-center justify-between p-4 ${theme.cardSecondary} rounded-lg ${theme.borderSecondary} border`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-full ${getStatusColor(doctor.status)}`}>
                {getStatusIcon(doctor.status)}
              </div>
              <div>
                <h3 className={`font-medium ${theme.textPrimary}`}>{doctor.name}</h3>
                <p className={`text-sm ${theme.textMuted}`}>
                  {doctor.status === 'available' ? 'Available now' : 'Next slot: ' + doctor.nextSlot}
                </p>
              </div>
            </div>
            <div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doctor.status)}`}>
                {doctor.status.charAt(0).toUpperCase() + doctor.status.slice(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default DoctorAvailability;