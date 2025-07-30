// components/dashboard/SummaryCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
ArrowUpRight
} from 'lucide-react';

const SummaryCard = ({ card, theme }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className={`text-sm font-medium ${theme.textMuted} mb-1`}>{card.title}</p>
          <p className={`text-2xl font-bold ${theme.textPrimary}`}>{card.value}</p>
          <div className="flex items-center mt-2">
            <ArrowUpRight className={`w-4 h-4 ${card.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-sm ml-1 ${card.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
              {card.change}
            </span>
            <span className={`text-xs ${theme.textMuted} ml-2`}>from last week</span>
          </div>
        </div>
        <div className={`p-3 rounded-full ${card.bgColor} border`}>
          <card.icon className={`w-6 h-6 ${card.color}`} />
        </div>
      </div>
    </motion.div>
  );
};

export default SummaryCard;