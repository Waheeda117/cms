import React from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Gauge, 
  CalendarX, 
  BarChart2 
} from 'lucide-react';

const SummaryCards = ({ theme, data }) => {
  const summaryCards = [
    // {
    //   title: "Total Items",
    //   value: data?.totalItems || 0,
    //   icon: Package,
    //   color: "text-blue-500",
    //   bgColor: "bg-blue-500 bg-opacity-20 border-blue-500",
    // },
    {
      title: "Low Stock Medicines",
      value: data?.lowStock || 0,
      icon: Gauge,
      color: "text-orange-500",
      bgColor: "bg-orange-500 bg-opacity-20 border-orange-500",
    },
    {
      title: "Expiring Soon",
      value: data?.nearExpiry || 0,
      icon: CalendarX,
      color: "text-red-500",
      bgColor: "bg-red-500 bg-opacity-20 border-red-500",
    },
    {
      title: "Expired Items",
      value: data?.alreadyExpired || 0,
      icon: CalendarX,
      color: "text-red-500",
      bgColor: "bg-red-500 bg-opacity-20 border-red-500",
    },
    {
      title: "Stock Value",
      value: data?.stockValue || "0M",
      icon: BarChart2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500 bg-opacity-20 border-emerald-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
    >
      {summaryCards.map((card, index) => (
        <motion.div
          key={index}
          whileHover={{ y: -5 }}
          className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${theme.textMuted}`}>{card.title}</p>
              <p className={`text-3xl font-bold ${theme.textPrimary} mt-2`}>{card.value}</p>
            </div>
            <div className={`p-3 rounded-full ${card.bgColor} border`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default SummaryCards;