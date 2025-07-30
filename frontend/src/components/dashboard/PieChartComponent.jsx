// components/charts/PieChart.jsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981'];

const PieChartComponent = ({ data, theme }) => {
  const isDark = theme.textPrimary.includes('white');
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
          itemStyle={{ color: isDark ? '#ffffff' : '#1f2937' }}
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
  );
};

export default PieChartComponent;