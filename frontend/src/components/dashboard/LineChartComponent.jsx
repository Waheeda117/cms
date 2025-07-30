// components/charts/LineChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LineChartComponent = ({ data, theme }) => {
  const isDark = theme.textPrimary.includes('white');
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke={isDark ? '#4b5563' : '#e5e7eb'} 
        />
        <XAxis 
          dataKey="day" 
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
        <Line 
          type="monotone" 
          dataKey="appointments" 
          stroke="#10b981" 
          activeDot={{ r: 8 }} 
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineChartComponent;