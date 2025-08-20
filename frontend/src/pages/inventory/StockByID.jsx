import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Pill,
  Calendar,
  Box,
  Layers,
  DollarSign,
  Search,
  ArrowDownUp,
  Eye,
  ChevronLeft,
  FileText,
  Clock,
  Shield,
  Activity,
  Info,
  AlertCircle,
  Gauge,
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useParams, useNavigate } from "react-router-dom";
import { getStockById } from "../../api/api";
import formatDate from "../../utils/date";

const StockById = () => {
  const { stockId } = useParams();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        const data = await getStockById(stockId);
        setStockData(data);
      } catch (err) {
        setError("Failed to fetch stock data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [stockId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Handle error state
  if (error || !stockData || !stockData.success) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className={`text-center p-8 ${theme.cardOpacity} rounded-xl max-w-md`}
        >
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h3 className={`text-xl font-bold ${theme.textPrimary} mb-2`}>
            {error || "Failed to load stock data"}
          </h3>
          <p className={`${theme.textMuted} mb-6`}>
            Please check the medicine name or try again later
          </p>
          <button
            onClick={() => navigate(-1)}
            className={`px-4 py-2 ${theme.button} rounded-lg transition-colors`}
          >
            Back to All Stocks
          </button>
        </div>
      </div>
    );
  }

  // Helper function to get medicine status
  const getMedicineStatus = (medicine) => {
    const now = new Date();
    const expiryDate = new Date(medicine.expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiryDate - now) / (1000 * 60 * 60 * 24)
    );

    if (medicine.quantity <= medicine.reorderLevel) {
      return { status: "Low Stock", color: "red" };
    } else if (daysUntilExpiry <= 30) {
      return { status: "Expiring Soon", color: "orange" };
    } else if (daysUntilExpiry <= 90) {
      return { status: "Warning", color: "yellow" };
    }
    return { status: "Good", color: "green" };
  };

  // Handle sorting
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting
  const getSortedItems = () => {
    if (!stockData.data.stockEntries) return [];

    return [...stockData.data.stockEntries].sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === "createdAt") {
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
      } else if (sortConfig.key === "expiryDate") {
        aValue = new Date(a.medicine.expiryDate);
        bValue = new Date(b.medicine.expiryDate);
      } else if (sortConfig.key === "quantity") {
        aValue = a.medicine.quantity;
        bValue = b.medicine.quantity;
      } else if (sortConfig.key === "price") {
        aValue = a.medicine.price;
        bValue = b.medicine.price;
      } else if (sortConfig.key === "totalAmount") {
        aValue = a.medicine.totalAmount;
        bValue = b.medicine.totalAmount;
      } else {
        aValue = a[sortConfig.key];
        bValue = b[sortConfig.key];
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  // Filter items based on search term
  const filteredItems = getSortedItems().filter((item) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.batchNumber.toLowerCase().includes(searchLower) ||
      item.billID.toLowerCase().includes(searchLower) ||
      item.medicine.medicineName.toLowerCase().includes(searchLower)
    );
  });

  // Summary cards data
  const summaryCards = [
    {
      title: "Total Batches",
      value: stockData.data.summary.totalBatches,
      icon: Box,
      color: "text-blue-500",
      bgColor: "bg-blue-500 bg-opacity-20 border-blue-500",
    },
    {
      title: "Total Quantity",
      value: stockData.data.summary.totalQuantity,
      icon: Layers,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500 bg-opacity-20 border-emerald-500",
    },
    {
      title: "Total Value",
      value: `PKR ${stockData.data.summary.totalValue}`,
      icon: DollarSign,
      color: "text-purple-500",
      bgColor: "bg-purple-500 bg-opacity-20 border-purple-500",
    },
    // {
    //   title: "Batch Status",
    //   value: stockData.data.summary.overallStatus,
    //   icon: Shield,
    //   color: "text-green-500",
    //   bgColor: "bg-green-500 bg-opacity-20 border-green-500",
    // },
  ];

  return (
    <div className="p-4 sm:p-6">
      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center space-x-2 py-2 ${theme.cardSecondary} hover:bg-opacity-70 transition-colors rounded-lg`}
        >
          <ChevronLeft className={`w-5 h-5 ${theme.textPrimary}`} />
          <span className={theme.textPrimary}>Back to All Stocks</span>
        </button>
      </motion.div>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className={`text-2xl sm:text-3xl font-bold ${theme.textPrimary} mb-2`}
            >
              {stockData.data.medicineName}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {/* Medicine ID - Only show if available */}
              {stockData.data.stockEntries.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Pill className={`w-4 h-4 ${theme.textMuted}`} />
                  <span className={theme.textMuted}>
                    Medicine ID:{" "}
                    {stockData.data.stockEntries[0].medicine.medicineId}
                  </span>
                </div>
              )}

              {/* <div className="flex items-center space-x-2 ">
                <Activity className={`w-4 h-4 ${theme.textMuted}`} />
                <span className={theme.textMuted}>
                  Status: {stockData.data.summary.overallStatus}
                </span>
              </div> */}

              {/* Reorder Level - Only show if available */}
              {/* {stockData.data.stockEntries.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Gauge className={`w-4 h-4 ${theme.textMuted}`} />
                  <span className={theme.textMuted}>
                    Reorder Level: {stockData.data.stockEntries[0].medicine.reorderLevel} units
                  </span>
                </div>
              )} */}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8"
      >
        {summaryCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`p-4 sm:p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${theme.textMuted}`}>
                  {card.title}
                </p>
                <p
                  className={`text-xl sm:text-2xl font-bold ${theme.textPrimary} mt-2`}
                >
                  {card.value}
                </p>
              </div>
              <div className={`p-2 sm:p-3 rounded-full ${card.bgColor} border`}>
                <card.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${card.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Detailed Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border mb-8`}
      >
        <div className="p-4 sm:p-6">
          <h2
            className={`text-xl sm:text-2xl font-bold ${theme.textPrimary} mb-4`}
          >
            Detailed Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className={`text-sm ${theme.textMuted}`}>Average Price</p>
              <p className={`text-lg font-semibold ${theme.textPrimary}`}>
                PKR {stockData.data.summary.averagePrice.toFixed(2)}
              </p>
            </div>
            <div>
              <p className={`text-sm ${theme.textMuted}`}>Low Stock Batches</p>
              <p
                className={`text-lg font-semibold ${
                  stockData.data.summary.lowStockBatches > 0
                    ? "text-amber-500"
                    : theme.textPrimary
                }`}
              >
                {stockData.data.summary.lowStockBatches}
              </p>
            </div>
            {/* <div>
              <p className={`text-sm ${theme.textMuted}`}>Expiring Soon</p>
              <p className={`text-lg font-semibold ${stockData.data.summary.expiringSoonBatches > 0 ? 'text-amber-500' : theme.textPrimary}`}>
                {stockData.data.summary.expiringSoonBatches}
              </p>
            </div> */}
            {/* <div>
              <p className={`text-sm ${theme.textMuted}`}>Expired Batches</p>
              <p className={`text-lg font-semibold ${stockData.data.summary.expiredBatches > 0 ? 'text-red-500' : theme.textPrimary}`}>
                {stockData.data.summary.expiredBatches}
              </p>
            </div> */}
            {/* <div>
              <p className={`text-sm ${theme.textMuted}`}>Total Batches</p>
              <p className={`text-lg font-semibold ${theme.textPrimary}`}>
                {stockData.data.summary.totalBatches}
              </p>
            </div> */}
            <div>
              <p className={`text-sm ${theme.textMuted}`}>Last Updated</p>
              <p className={`text-lg font-semibold ${theme.textPrimary}`}>
                {formatDate(stockData.data.stockEntries[0].updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Batch History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className={`${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
      >
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
            <div>
              <h2
                className={`text-xl sm:text-2xl font-bold ${theme.textPrimary} mb-2`}
              >
                Batch History
              </h2>
              <p className={`${theme.textMuted}`}>
                All batches for {stockData.data.medicineName}
              </p>
            </div>

            {/* Search */}
            <div className="w-full sm:w-64">
              <div className="relative">
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
                />
                <input
                  type="text"
                  placeholder="Search batches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
                />
              </div>
            </div>
          </div>

          {/* Batch Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${theme.borderSecondary} border-b`}>
                  <th className="px-4 py-3 text-left text-xs font-medium">
                    <div
                      className={`flex items-center ${theme.textMuted} tracking-wider`}
                    >
                      <span>Batch Number</span>
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-medium cursor-pointer min-w-44"
                    onClick={() => requestSort("billID")}
                  >
                    <div
                      className={`flex items-center justify-center ${theme.textMuted} tracking-wider`}
                    >
                      <span>Cheque Number</span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-medium cursor-pointer min-w-36"
                    onClick={() => requestSort("quantity")}
                  >
                    <div
                      className={`flex items-center justify-center ${theme.textMuted} tracking-wider`}
                    >
                      <span>Quantity</span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-medium cursor-pointer min-w-36"
                    onClick={() => requestSort("price")}
                  >
                    <div
                      className={`flex items-center justify-center ${theme.textMuted} tracking-wider`}
                    >
                      <span>Unit Price</span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-medium cursor-pointer min-w-36"
                    onClick={() => requestSort("totalAmount")}
                  >
                    <div
                      className={`flex items-center justify-center ${theme.textMuted} tracking-wider`}
                    >
                      <span>Total Amount</span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-medium cursor-pointer min-w-36"
                    onClick={() => requestSort("createdAt")}
                  >
                    <div
                      className={`flex items-center justify-center ${theme.textMuted} tracking-wider`}
                    >
                      <span>Date Added</span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-medium cursor-pointer min-w-36"
                    onClick={() => requestSort("expiryDate")}
                  >
                    <div
                      className={`flex items-center justify-center ${theme.textMuted} tracking-wider`}
                    >
                      <span>Expiry Date</span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  {/* <th className={`px-4 py-3 text-center text-xs font-medium ${theme.textMuted} tracking-wider min-w-36`}>
                    Status
                  </th> */}
                  {/* <th className={`px-4 py-3 text-center text-xs font-medium ${theme.textMuted} tracking-wider`}>
                    Actions
                  </th> */}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.map((item, index) => {
                  const medicineStatus = getMedicineStatus(item.medicine);
                  return (
                    <tr
                      key={item._id}
                      className={`${theme.borderSecondary} border-b ${theme.textSecondary} hover:bg-opacity-50 ${theme.cardSecondary} transition-colors`}
                    >
                      <td className="px-4 py-4 min-w-[120px]">
                        <div className="font-medium text-sm sm:text-base">
                          {item.batchNumber}
                        </div>
                      </td>
                      <td
                        className={`px-4 py-4 text-center text-sm ${theme.textSecondary}`}
                      >
                        {item.billID}
                      </td>
                      <td
                        className={`px-4 py-4 text-center text-sm ${theme.textSecondary}`}
                      >
                        <span
                          className={
                            item.medicine.quantity <= item.medicine.reorderLevel
                              ? "text-amber-500"
                              : "text-emerald-500"
                          }
                        >
                          {item.medicine.quantity} units
                        </span>
                      </td>
                      <td
                        className={`px-4 py-4 text-center text-sm ${theme.textSecondary}`}
                      >
                        PKR {item.medicine.price}
                      </td>
                      <td
                        className={`px-4 py-4 text-center text-sm font-semibold ${theme.textPrimary}`}
                      >
                        PKR {item.medicine.totalAmount}
                      </td>
                      <td
                        className={`px-4 py-4 text-center text-sm ${theme.textSecondary}`}
                      >
                        {formatDate(item.createdAt)}
                      </td>
                      <td
                        className={`px-4 py-4 text-center text-sm ${theme.textSecondary}`}
                      >
                        <div className="flex flex-col items-center">
                          <span>{formatDate(item.medicine.expiryDate)}</span>
                          <span className="text-xs text-gray-500">
                            (
                            {Math.ceil(
                              (new Date(item.medicine.expiryDate) -
                                new Date()) /
                                (1000 * 60 * 60 * 24)
                            )}{" "}
                            days)
                          </span>
                        </div>
                      </td>
                      {/* <td className="px-4 py-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            medicineStatus.color === "green"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : medicineStatus.color === "yellow"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : medicineStatus.color === "orange"
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {medicineStatus.status}
                        </span>
                      </td> */}
                      {/* <td className="px-4 py-4">
                        <div className="flex justify-center">
                          <button
                            title="View Batch Details"
                            className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
                            onClick={() => navigate(`/batch/${item._id}`)}
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </button>
                        </div>
                      </td> */}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Package
                className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`}
              />
              <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
                {searchTerm
                  ? `No batches found matching "${searchTerm}"`
                  : "No batch entries found"}
              </h3>
              <p className={`${theme.textMuted}`}>
                {searchTerm
                  ? "Try adjusting your search terms or clear the search"
                  : "Add new batches to see them here"}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default StockById;
