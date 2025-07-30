// components/dashboard/UpcomingAppointments.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, User, Stethoscope, ChevronRight } from 'lucide-react';

const UpcomingAppointments = ({ theme }) => {
  const appointments = [
    { id: 1, patient: 'Ali Ahmed', doctor: 'Dr. Sara Khan', time: '10:30 AM', type: 'Follow-up' },
    { id: 2, patient: 'Fatima Zahra', doctor: 'Dr. Ahmed Raza', time: '11:15 AM', type: 'Consultation' },
    { id: 3, patient: 'Bilal Hassan', doctor: 'Dr. Ayesha Malik', time: '1:45 PM', type: 'Checkup' },
    { id: 4, patient: 'Zainab Akhtar', doctor: 'Dr. Usman Ali', time: '2:30 PM', type: 'Consultation' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
    >
      <div className="flex flex-col sm:flex-row gap-5 justify-between mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-1`}>
            Upcoming Appointments
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
            className={`flex flex-col sm:flex-row gap-5 justify-between p-4 ${theme.cardSecondary} rounded-lg ${theme.borderSecondary} border`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-medium ${theme.textPrimary}`}>{appointment.time}</h3>
                <p className={`text-sm ${theme.textMuted} flex items-center`}>
                  <User className="w-4 h-4 mr-1" />
                  {appointment.patient}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`${theme.textSecondary} flex items-center justify-end`}>
                <Stethoscope className="w-4 h-4 mr-1" />
                {appointment.doctor}
              </p>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                {appointment.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default UpcomingAppointments;