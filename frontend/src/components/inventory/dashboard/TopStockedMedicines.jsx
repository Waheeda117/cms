import React from 'react';
import BarChart from '../charts/BarChartComponent';
import { Pill } from 'lucide-react';

const TopStockedMedicines = ({ theme }) => {
  const topMedicines = [
    { medicine: "Paracetamol", stock: 142 },
    { medicine: "Amoxicillin", stock: 98 },
    { medicine: "Omeprazole", stock: 76 },
    { medicine: "Atorvastatin", stock: 65 },
    { medicine: "Metformin", stock: 54 },
  ];

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
        <BarChart 
          data={topMedicines} 
          dataKey="stock"
          xAxisKey="medicine"
          theme={theme} 
          color="#0ea5e9"
        />
      </div>
    </div>
  );
};

export default TopStockedMedicines;