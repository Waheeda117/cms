import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const InventoryDistributionChart = ({ theme }) => {
  const data = [
    { name: 'Tablets', value: 45 },
    { name: 'Injections', value: 25 },
    { name: 'Syrups', value: 15 },
    { name: 'Ointments', value: 10 },
    { name: 'Other', value: 5 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
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
            backgroundColor: theme.cardPrimary,
            borderColor: theme.border,
            color: theme.textPrimary,
            borderRadius: '8px'
          }}
        />
        <Legend 
          layout="vertical" 
          verticalAlign="middle" 
          align="right"
          formatter={(value, entry) => (
            <span className={theme.textPrimary}>{value}</span>
          )}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

export default InventoryDistributionChart;