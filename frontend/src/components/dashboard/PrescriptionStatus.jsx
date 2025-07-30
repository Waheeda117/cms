// components/dashboard/PrescriptionStatus.jsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const PrescriptionStatus = ({ theme }) => {
  const isDark = theme.textPrimary.includes('white');
  
  const data = [
    { name: 'Fulfilled', value: 75 },
    { name: 'Pending', value: 18 },
    { name: 'Rejected', value: 7 }
  ];
  
  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border h-full`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-1`}>
            Prescription Status
          </h2>
          <p className={`text-sm ${theme.textMuted}`}>
            Distribution of prescription outcomes
          </p>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb',
                borderRadius: '0.5rem',
              }}
              formatter={(value) => [`${value}%`, 'Percentage']}
            />
            <Legend
              iconType="circle"
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{
                color: isDark ? '#f3f4f6' : '#374151',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PrescriptionStatus;