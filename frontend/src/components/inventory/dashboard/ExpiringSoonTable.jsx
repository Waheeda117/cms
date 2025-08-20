import React from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, ChevronRight, Calendar } from 'lucide-react';
import { useNavigate } from "react-router-dom";


const ExpiringSoonTable = ({ theme, data }) => {
  const expiringItems = data || [];

  const navigate = useNavigate();
  

  return (
    <div className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}>
      <div className="flex flex-col sm:flex-row gap-5 justify-between mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-1`}>
            Expiring Soon
          </h2>
          <p className={`text-sm ${theme.textMuted}`}>
            Medicines expiring within 10 days
          </p>
        </div>
        {expiringItems.length > 0 && (
          <div onClick={() => navigate(`/pharmacist_inventory/expire-soon-items`)} className="flex items-center text-emerald-500 cursor-pointer">
            <span className="text-sm font-medium mr-1">View All</span>
            <ChevronRight className="w-5 h-5" />
          </div>
        )}
      </div>

{expiringItems.length > 0 ? (
  <div className="space-y-4">
    {expiringItems.map((item) => (
      <motion.div
        key={item.id}
        whileHover={{ scale: 1.02 }}
        className={`p-4 rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50 mr-3">
              <CalendarClock className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className={`font-medium ${theme.textPrimary}`}>
                {item.name}
              </h3>
              <p className={`text-sm ${theme.textMuted}`}>
                Total Quantity: {item.totalQuantity} • {item.batches.length} batch(es)
              </p>
            </div>
          </div>
          {/* <div className="flex items-center">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              item.daysLeft < 5 
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
            }`}>
              {item.daysLeft} days
            </span>
          </div> */}
        </div>
        
        {/* Batch Details */}
        {/* <div className="ml-12 space-y-2">
          {item.batches.map((batch, index) => (
            <div key={index} className={`text-sm ${theme.textMuted} p-2 rounded ${theme.cardOpacity}`}>
              <span className="font-medium">Batch {batch.batchNumber}:</span> 
              <span className="ml-2">Qty: {batch.quantity}</span>
              <span className="ml-3">Expires: {batch.expiry}</span>
              <span className="ml-3">({batch.daysLeft} days left)</span>
            </div>
          ))}
        </div> */}
      </motion.div>
    ))}
  </div>
) : (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Calendar className={`w-12 h-12 ${theme.textMuted} mx-auto mb-4 opacity-50`} />
            <p className={`${theme.textMuted} text-lg font-medium`}>No Items Expiring Soon</p>
            <p className={`${theme.textMuted} text-sm mt-2`}>
              No medicines are expiring within the next 10 days
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpiringSoonTable;