import React from 'react';
import BarChart from '../charts/BarChartComponent';
import { Pill } from 'lucide-react';

const TopStockedMedicines = ({ theme, data }) => {
  const topMedicines = data || [];

  return (
    <div className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-1`}>
            Top Stocked Medicines
          </h2>
          <p className={`text-sm ${theme.textMuted}`}>
            Highest quantity in inventory
          </p>
        </div>
        <Pill className={`w-5 h-5 ${theme.textMuted}`} />
      </div>
      
      <div className="h-80">
        {topMedicines.length > 0 ? (
          <BarChart 
            data={topMedicines} 
            dataKey="stock"
            xAxisKey="medicine"
            theme={theme} 
            color="#0ea5e9"
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Pill className={`w-12 h-12 ${theme.textMuted} mx-auto mb-4 opacity-50`} />
              <p className={`${theme.textMuted} text-lg font-medium`}>No Medicine Data Available</p>
              <p className={`${theme.textMuted} text-sm mt-2`}>
                Top stocked medicines will appear here once inventory is added
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopStockedMedicines;