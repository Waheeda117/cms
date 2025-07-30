// components/dashboard/RecentAppointments.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, User, Stethoscope, ChevronRight } from 'lucide-react';

const RecentAppointments = ({ theme }) => {
  const appointments = [
    { id: 1, patient: 'Ali Ahmed', doctor: 'Dr. Sara Khan', time: '10:30 AM', status: 'completed' },
    { id: 2, patient: 'Fatima Zahra', doctor: 'Dr. Ahmed Raza', time: '11:15 AM', status: 'scheduled' },
    { id: 3, patient: 'Bilal Hassan', doctor: 'Dr. Ayesha Malik', time: '1:45 PM', status: 'scheduled' },
    { id: 4, patient: 'Zainab Akhtar', doctor: 'Dr. Usman Ali', time: '2:30 PM', status: 'canceled' },
    { id: 5, patient: 'Omar Farooq', doctor: 'Dr. Hina Siddiqui', time: '3:15 PM', status: 'scheduled' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'canceled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'canceled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
    >
      <div className="flex flex-col sm:flex-row gap-5 justify-between mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-1`}>
            Recent Appointments
          </h2>
          <p className={`text-sm ${theme.textMuted}`}>
            Today's scheduled appointments
          </p>
        </div>
        <button className={`flex items-center text-sm ${theme.textSecondary} hover:${theme.textPrimary} transition-colors`}>
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      <div className="space-y-4">
        {appointments.map((appointment) => (
          <div 
            key={appointment.id}
            className={`flex items-center justify-between p-4 ${theme.cardSecondary} rounded-lg ${theme.borderSecondary} border`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-full ${getStatusColor(appointment.status)}`}>
                {getStatusIcon(appointment.status)}
              </div>
              <div>
                <h3 className={`font-medium ${theme.textPrimary}`}>{appointment.patient}</h3>
                <p className={`text-sm ${theme.textMuted} flex items-center`}>
                  <Stethoscope className="w-4 h-4 mr-1" />
                  {appointment.doctor}
                </p>
              </div>
            </div>
            <div className={`text-right ${theme.textSecondary}`}>
              <p className="font-medium">{appointment.time}</p>
              <span className={`text-xs capitalize px-2 py-1 rounded-full ${getStatusColor(appointment.status)}`}>
                {appointment.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default RecentAppointments;