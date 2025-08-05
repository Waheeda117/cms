import React from 'react';
import { useEffect } from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BarChartComponent = ({ data, dataKey, xAxisKey, theme, color }) => {

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
        <XAxis 
          dataKey={xAxisKey} 
          stroke={theme.textSecondary} 
        />
        <YAxis 
          stroke={theme.textSecondary} 
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "#fff",
            borderColor: theme.border,
            color: theme.textPrimary,
            borderRadius: '8px'
          }}
        />
        <Bar 
          dataKey={dataKey} 
          fill={color} 
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChartComponent;