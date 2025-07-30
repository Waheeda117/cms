import React from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, ChevronRight } from 'lucide-react';

const ExpiringSoonTable = ({ theme }) => {
  const expiringItems = [
    {
      id: 1,
      name: "Atorvastatin Syrup",
      batch: "PJAA85",
      expiry: "2023-12-15",
      daysLeft: 15,
    },
    {
      id: 2,
      name: "Omeprazole Tablets",
      batch: "BAC010",
      expiry: "2023-12-20",
      daysLeft: 20,
    },
    {
      id: 3,
      name: "Diazepam Injection",
      batch: "OSPA",
      expiry: "2023-12-25",
      daysLeft: 25,
    },
  ];

  return (
    <div className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}>
      <div className="flex flex-col sm:flex-row gap-5 justify-between mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-1`}>
            Expiring Soon
          </h2>
          <p className={`text-sm ${theme.textMuted}`}>
            Medicines expiring within 30 days
          </p>
        </div>
        <div className="flex items-center text-emerald-500 cursor-pointer">
          <span className="text-sm font-medium mr-1">View All</span>
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-4">
        {expiringItems.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.02 }}
            className={`flex items-center justify-between p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50 mr-3">
                <CalendarClock className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className={`font-medium ${theme.textPrimary}`}>
                  {item.name}
                </h3>
                <p className={`text-sm ${theme.textMuted}`}>
                  Batch: {item.batch} • Exp: {item.expiry}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                item.daysLeft < 15 
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
              }`}>
                {item.daysLeft} days
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ExpiringSoonTable;