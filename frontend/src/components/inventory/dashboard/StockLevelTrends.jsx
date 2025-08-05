import React from 'react';
import LineChart from '../charts/LineChartComponent';
import { Activity } from 'lucide-react';

const StockLevelTrends = ({ theme, dateRange, data }) => {
  const stockLevelData = data || [];

  return (
    <div className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border h-full`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-1`}>
            Stock Level Trends
          </h2>
          <p className={`text-sm ${theme.textMuted}`}>
            {dateRange === "this_week" ? "Weekly" : "Monthly"} inventory movement
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
            <span className={`text-xs ${theme.textSecondary}`}>
              Stock Levels
            </span>
          </div>
        </div>
      </div>
      
      {/* Responsive height */}
      <div className="h-[300px]">
        {stockLevelData.length > 0 ? (
          <LineChart 
            data={stockLevelData} 
            dataKey="stock"
            xAxisKey="week"
            theme={theme} 
            color="#10b981"
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Activity className={`w-12 h-12 ${theme.textMuted} mx-auto mb-4 opacity-50`} />
              <p className={`${theme.textMuted} text-lg font-medium`}>No Stock Data Available</p>
              <p className={`${theme.textMuted} text-sm mt-2`}>
                Stock trends will appear here once inventory data is recorded
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockLevelTrends;