import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronRight, Package } from 'lucide-react';

const LowStockAlerts = ({ theme, data }) => {
  const lowStockItems = data || [];

  return (
    <div className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}>
      <div className="flex flex-col sm:flex-row gap-5 justify-between mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-1`}>
            Low Stock Alerts
          </h2>
          <p className={`text-sm ${theme.textMuted}`}>
            Items below reorder level
          </p>
        </div>
        {/* {lowStockItems.length > 0 && (
          <div className="flex items-center text-emerald-500 cursor-pointer">
            <span className="text-sm font-medium mr-1">View All</span>
            <ChevronRight className="w-5 h-5" />
          </div>
        )} */}
      </div>

      {lowStockItems.length > 0 ? (
        <div className="space-y-4">
          {lowStockItems.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              className={`flex items-center justify-between p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}
            >
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/50 mr-3">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className={`font-medium ${theme.textPrimary}`}>
                    {item.name}
                  </h3>
                  <p className={`text-sm ${theme.textMuted}`}>
                    Batch: {item.batch} • Current: {item.current} units
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Package className={`w-12 h-12 ${theme.textMuted} mx-auto mb-4 opacity-50`} />
            <p className={`${theme.textMuted} text-lg font-medium`}>No Low Stock Items</p>
            <p className={`${theme.textMuted} text-sm mt-2`}>
              All items are currently above their reorder levels
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LowStockAlerts;