import React from 'react';
import { BarChart2 } from 'lucide-react';
import InventoryDistributionChart from '../charts/InventoryDistributionChart';

const InventoryValueDistribution = ({ theme }) => {
  return (
    <div className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-1`}>
            Inventory Value
          </h2>
          <p className={`text-sm ${theme.textMuted}`}>
            Distribution by category
          </p>
        </div>
        <BarChart2 className={`w-5 h-5 ${theme.textMuted}`} />
      </div>
      <div className="h-80">
        <InventoryDistributionChart theme={theme} />
      </div>
    </div>
  );
};

export default InventoryValueDistribution;