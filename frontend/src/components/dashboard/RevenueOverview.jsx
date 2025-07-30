// components/dashboard/RevenueOverview.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight } from 'lucide-react';

const RevenueOverview = ({ theme }) => {
  const isDark = theme.textPrimary.includes('white');
  
  const data = [
    { month: 'Jan', revenue: 12500 },
    { month: 'Feb', revenue: 18900 },
    { month: 'Mar', revenue: 14200 },
    { month: 'Apr', revenue: 17800 },
    { month: 'May', revenue: 21100 },
    { month: 'Jun', revenue: 19500 },
  ];

  return (
    <div className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}>
      <div className="flex flex-col sm:flex-row gap-5 justify-between items-start mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-1`}>
            Revenue Overview
          </h2>
          <p className={`text-sm ${theme.textMuted} mb-2`}>
            Monthly revenue performance
          </p>
          <div className="flex items-center">
            <span className={`text-2xl font-bold ${theme.textPrimary}`}>₨195,400</span>
            <div className="flex items-center ml-3 text-green-500">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-sm ml-1">+12.5%</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-sm ${theme.textMuted}`}>Current Month</span>
          <p className={`text-lg font-medium ${theme.textPrimary}`}>Jun 2025</p>
        </div>
      </div>
      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false}
              stroke={isDark ? '#4b5563' : '#e5e7eb'} 
            />
            <XAxis 
              dataKey="month" 
              stroke={isDark ? '#9ca3af' : '#6b7280'} 
            />
            <YAxis 
              stroke={isDark ? '#9ca3af' : '#6b7280'} 
              tickFormatter={(value) => `₨${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb',
                borderRadius: '0.5rem',
              }}
              formatter={(value) => [`₨${value.toLocaleString()}`, 'Revenue']}
            />
            <Bar 
              dataKey="revenue" 
              fill="#8b5cf6" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueOverview;