import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LineChartComponent = ({ data, dataKey, xAxisKey, theme, color }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart
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
            backgroundColor: theme.cardPrimary,
            borderColor: theme.border,
            color: theme.textPrimary,
            borderRadius: '8px'
          }}
        />
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color} 
          activeDot={{ r: 8 }} 
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChartComponent;