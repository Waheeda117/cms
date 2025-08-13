import React, { useState, useEffect } from "react";
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
import ExpiredItemsTable from "../../components/inventory/dashboard/ExpiredItemsTable"; // NEW IMPORT
import { getDashboardStats } from "../../api/api";

const InventoryAdminDashboard = () => {
  const { theme } = useTheme();
  const [dateRange, setDateRange] = useState("this_month");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const result = await getDashboardStats(dateRange);
      setDashboardData(result.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
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
              Overview of medicine stock levels, top stocks and expiry status.
            </p>
          </div>
          {/* Date Range Selector */}
          {/* <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={`px-4 py-2 rounded-lg ${theme.cardOpacity} ${theme.border} border`}
          >
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select> */}
        </div>
      </motion.div>

      <SummaryCards theme={theme} data={dashboardData?.summary} />

      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <StockLevelTrends
          theme={theme}
          dateRange={dateRange}
          data={dashboardData?.stockTrends}
        />

        <div className="grid grid-cols-1 gap-6">
          <TopStockedMedicines
            theme={theme}
            data={dashboardData?.topStockedMedicines}
          />
        </div>
      </div> */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LowStockAlerts theme={theme} data={dashboardData?.lowStockItems} />
        <ExpiringSoonTable
          theme={theme}
          data={dashboardData?.expiringSoonItems}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
            
        <ExpiredItemsTable
          theme={theme}
          data={dashboardData?.alreadyExpiredItems}
        />
      </div>



    </div>
  );
};

export default InventoryAdminDashboard;