// components/dashboard/PatientVisitsTrend.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PatientVisitsTrend = ({ theme }) => {
  const isDark = theme.textPrimary.includes('white');
  
  const data = [
    { day: 'Mon', visits: 42 },
    { day: 'Tue', visits: 38 },
    { day: 'Wed', visits: 55 },
    { day: 'Thu', visits: 47 },
    { day: 'Fri', visits: 60 },
    { day: 'Sat', visits: 28 },
    { day: 'Sun', visits: 18 }
  ];

  return (
    <div className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border h-full`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-1`}>
            Patient Visits Trend
          </h2>
          <p className={`text-sm ${theme.textMuted}`}>
            Weekly patient visit patterns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
            <span className={`text-xs ${theme.textSecondary}`}>Visits</span>
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
              dataKey="visits" 
              stroke="#10b981" 
              strokeWidth={2}
              activeDot={{ r: 6 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PatientVisitsTrend;