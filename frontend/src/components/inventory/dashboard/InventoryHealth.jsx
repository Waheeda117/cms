import React from 'react';
import { 
  Activity,
  Box,
  Gauge,
  CalendarClock,
  AlertCircle
} from 'lucide-react';

const InventoryHealth = ({ theme }) => {
  const inventoryStats = {
    totalItems: 342,
    lowStock: 28,
    nearExpiry: 14,
    outOfStock: 5,
  };

  return (
    <div className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border h-full`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
          Inventory Health
        </h3>
        <Activity className={`w-5 h-5 ${theme.textMuted}`} />
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Box className="w-4 h-4 text-green-500 mr-2" />
            <span className={`${theme.textSecondary}`}>Total Items</span>
          </div>
          <span className={`font-medium ${theme.textPrimary}`}>
            {inventoryStats.totalItems}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Gauge className="w-4 h-4 text-yellow-500 mr-2" />
            <span className={`${theme.textSecondary}`}>Low Stock</span>
          </div>
          <div className="flex items-center">
            <span className={`font-medium ${theme.textPrimary}`}>
              {inventoryStats.lowStock}
            </span>
            <span className="text-xs text-red-500 ml-2">Attention</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <CalendarClock className="w-4 h-4 text-orange-500 mr-2" />
            <span className={`${theme.textSecondary}`}>Near Expiry</span>
          </div>
          <span className={`font-medium ${theme.textPrimary}`}>
            {inventoryStats.nearExpiry}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
            <span className={`${theme.textSecondary}`}>Out of Stock</span>
          </div>
          <span className={`font-medium ${theme.textPrimary}`}>
            {inventoryStats.outOfStock}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InventoryHealth;