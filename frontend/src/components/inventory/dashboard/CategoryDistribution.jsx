import React from 'react';
import PieChartComponent from '../charts/PieChartComponent';
import { Layers } from 'lucide-react';

const CategoryDistribution = ({ theme }) => {
  const categoryData = [
    { category: "Tablets", value: 142 },
    { category: "Syrups", value: 87 },
    { category: "Injections", value: 65 },
    { category: "Ointments", value: 48 },
  ];

  return (
    <div className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-lg font-semibold ${theme.textPrimary} mb-1`}>
            Category Distribution
          </h2>
          <p className={`text-sm ${theme.textMuted}`}>
            Stock by medicine form
          </p>
        </div>
        <Layers className={`w-5 h-5 ${theme.textMuted}`} />
      </div>
      <div className="h-48">
        <PieChartComponent 
          data={categoryData} 
          dataKey="value"
          nameKey="category"
          theme={theme}
        />
      </div>
    </div>
  );
};

export default CategoryDistribution;