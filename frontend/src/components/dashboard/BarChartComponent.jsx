// components/charts/BarChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BarChartComponent = ({ data, theme }) => {
  const isDark = theme.textPrimary.includes('white');
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke={isDark ? '#4b5563' : '#e5e7eb'} 
        />
        <XAxis 
          dataKey="medicine" 
          stroke={isDark ? '#9ca3af' : '#6b7280'} 
        />
        <YAxis 
          stroke={isDark ? '#9ca3af' : '#6b7280'} 
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderColor: isDark ? '#374151' : '#e5e7eb',
            borderRadius: '0.5rem',
          }}
          itemStyle={{ color: isDark ? '#ffffff' : '#1f2937' }}
        />
        <Bar 
          dataKey="count" 
          fill="#8b5cf6" 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarChartComponent;