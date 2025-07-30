import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../hooks/useTheme";
import SummaryCards from "../../components/inventory/dashboard/SummaryCards";
import StockLevelTrends from "../../components/inventory/dashboard/StockLevelTrends";
import InventoryHealth from "../../components/inventory/dashboard/InventoryHealth";
import CategoryDistribution from "../../components/inventory/dashboard/CategoryDistribution";
import TopStockedMedicines from "../../components/inventory/dashboard/TopStockedMedicines";
import InventoryValueDistribution from "../../components/inventory/dashboard/InventoryValueDistribution";
import LowStockAlerts from "../../components/inventory/dashboard/LowStockAlerts";
import ExpiringSoonTable from "../../components/inventory/dashboard/ExpiringSoonTable";

const InventoryAdminDashboard = () => {
  const { theme } = useTheme();
  const [dateRange, setDateRange] = useState("this_month");

  return (
    <div className="p-6" >
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-5 justify-between items-start">
          <div>
            <h1 className={`text-3xl font-bold ${theme.textPrimary} mb-1`}>
              Inventory Dashboard
            </h1>
            <p className={`${theme.textMuted}`}>
              Overview of medicine stock levels, expiry status, and inventory
              health
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setDateRange("this_week")}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                dateRange === "this_week"
                  ? "bg-emerald-500 text-white"
                  : theme.cardSecondary
              } ${theme.border} border ${theme.textPrimary}`}
            >
              This Week
            </button>
            <button
              onClick={() => setDateRange("this_month")}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                dateRange === "this_month"
                  ? "bg-emerald-500 text-white"
                  : theme.cardSecondary
              } ${theme.border} border ${theme.textPrimary}`}
            >
              This Month
            </button>
          </div>
        </div>
      </motion.div>

      <SummaryCards theme={theme} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left column - Stock Level Trends */}
        <StockLevelTrends theme={theme} dateRange={dateRange} />
        
        {/* Right column - stacked charts */}
        <div className="grid grid-cols-1 gap-6">
          <InventoryHealth theme={theme} />
          <CategoryDistribution theme={theme} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TopStockedMedicines theme={theme} />
        <InventoryValueDistribution theme={theme} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LowStockAlerts theme={theme} />
        <ExpiringSoonTable theme={theme} />
      </div>
    </div>
  );
};

export default InventoryAdminDashboard;
