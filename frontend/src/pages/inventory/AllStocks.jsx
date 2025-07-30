import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Pill,
  AlertCircle,
  CalendarX,
  Search,
  Eye,
  Edit,
  Trash2,
  Box,
  Gauge,
  BarChart2,
  ArrowDownUp,
  Layers,
  DollarSign,
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { getAllStocksData, getStockById } from "../../api/api";
import Pagination from "../../components/UI/Pagination";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

const AllStocks = () => {
  const { theme } = useTheme();
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [paginationData, setPaginationData] = useState(null);

  const navigate = useNavigate();

  const { user } = useAuthStore();
  const role = user?.role;

  // Fetch all stocks data from API
  const fetchData = async (
    page = currentPage,
    limit = itemsPerPage,
    search = searchTerm
  ) => {
    try {
      setLoading(true);
      const sortBy = sortConfig.key || "medicineName";
      const sortOrder = sortConfig.direction === "ascending" ? "asc" : "desc";

      const data = await getAllStocksData(page, limit, search);
      setStockData(data);
      setPaginationData(data.data.pagination);
    } catch (err) {
      setError("Failed to fetch aggregated inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  const medicines = stockData?.data?.medicines || [];

  // Handle sorting
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting
  const getSortedItems = () => {
    if (!stockData?.data?.medicines || !sortConfig.key)
      return stockData?.data?.medicines;

    return [...stockData.data.medicines].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle nested properties
      if (sortConfig.key === "totalQuantity") {
        aValue = a.totalQuantity;
        bValue = b.totalQuantity;
      } else if (sortConfig.key === "avgPrice") {
        aValue = a.avgPrice;
        bValue = b.avgPrice;
      } else if (sortConfig.key === "totalValue") {
        aValue = a.totalValue;
        bValue = b.totalValue;
      }

      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
  };

  // Filter items based on search term
  const filteredItems =
    getSortedItems()?.filter((item) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        item.medicineName.toLowerCase().includes(searchLower) ||
        item.batches.some((batch) =>
          batch.billID.toLowerCase().includes(searchLower)
        ) ||
        item.batches.some((batch) =>
          batch.batchNumber.toLowerCase().includes(searchLower)
        )
      );
    }) || [];

  // Summary cards data
  const summaryCards = [
    {
      title: "Total Medicines",
      value: stockData?.data?.summary?.totalMedicines || 0,
      icon: Box,
      color: "text-blue-500",
      bgColor: "bg-blue-500 bg-opacity-20 border-blue-500",
    },
    {
      title: "Low Stock",
      value: stockData?.data?.summary?.lowStockMedicines || 0,
      icon: Gauge,
      color: "text-orange-500",
      bgColor: "bg-orange-500 bg-opacity-20 border-orange-500",
    },
    {
      title: "Near expire stock",
      value: stockData?.data?.summary?.expiringWithin10Days,
      icon: Layers,
      color: "text-purple-500",
      bgColor: "bg-purple-500 bg-opacity-20 border-purple-500",
    },
    {
      title: "Expired stock",
      value: stockData?.data?.summary?.expiredMedicines,
      icon: Layers,
      color: "text-purple-500",
      bgColor: "bg-purple-500 bg-opacity-20 border-purple-500",
    },
    {
      title: "Total Value",
      value: stockData?.data?.summary?.totalInventoryValue
        ? `Rs.${stockData.data.summary.totalInventoryValue.toFixed(0)}`
        : "Rs. 0",
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500 bg-opacity-20 border-emerald-500",
    },
  ];

  // If loading, return loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Handle error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`text-center p-8 ${theme.cardOpacity} rounded-xl`}>
          <p className={`text-xl ${theme.textPrimary} mb-4`}>{error}</p>
          <button
            onClick={fetchData}
            className={`px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-lg`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className={`text-3xl font-bold ${theme.textPrimary} mb-2`}>
          Stock Details
        </h1>
        <p className={`${theme.textMuted}`}>
          View aggregated medicine stock levels across all batches
        </p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8 max-w-5xl"
      >
        {summaryCards.map((card, index) => (
          <div
            key={index}
            className={`py-4 px-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
          >
            <div className="flex items-center justify-between">
              {/* <div className={`p-3 rounded-full ${card.bgColor} border`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div> */}
              {/* <div className="flex flex-col justify-end items-end" > */}
              <p className={`text-sm font-medium ${theme.textMuted}`}>
                {card.title}
              </p>
              <p className={`text-lg font-bold ${theme.textPrimary}`}>
                {card.value}
              </p>
              {/* </div> */}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
      >
        <div className="p-6">
          {/* Header */}
          {/* <div className="mb-6">
            <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>
              Medicine Stock Summary
            </h2>
            <p className={`${theme.textMuted}`}>
              View aggregated stock levels grouped by medicine across all
              batches
            </p>
          </div> */}

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
              />
              <input
                type="text"
                placeholder="Search medicines here"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${theme.borderSecondary} border-b`}>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium cursor-pointer"
                    onClick={() => requestSort("medicineName")}
                  >
                    <div className={`flex items-center ${theme.textPrimary}`}>
                      <span className={`${theme.textMuted} tracking-wider`}>
                        Name
                      </span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer"
                    onClick={() => requestSort("totalQuantity")}
                  >
                    <div
                      className={`flex items-center ${theme.textPrimary} justify-center`}
                    >
                      <span className={`${theme.textMuted} tracking-wider`}>
                        Total Stock
                      </span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer"
                    onClick={() => requestSort("avgPrice")}
                  >
                    <div
                      className={`flex items-center ${theme.textPrimary} justify-center`}
                    >
                      <span className={`${theme.textMuted} tracking-wider`}>
                        Avg. Price
                      </span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer"
                    onClick={() => requestSort("totalValue")}
                  >
                    <div
                      className={`flex items-center ${theme.textPrimary} justify-center`}
                    >
                      <span className={`${theme.textMuted} tracking-wider`}>
                        Total Value
                      </span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer"
                    onClick={() => requestSort("batchCount")}
                  >
                    <div
                      className={`flex items-center ${theme.textPrimary} justify-center`}
                    >
                      <span className={`${theme.textMuted} tracking-wider`}>
                        Last Batch
                      </span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer"
                    onClick={() => requestSort("status")}
                  >
                    <div
                      className={`flex items-center ${theme.textPrimary} justify-center`}
                    >
                      <span className={`${theme.textMuted} tracking-wider`}>
                        Status
                      </span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  {/* <th 
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer"
                    onClick={() => requestSort('reorderLevel')}
                  >
                    <div className={`flex items-center ${theme.textPrimary} justify-center`}>
                      <span className={`${theme.textMuted} tracking-wider`}>Reorder Level</span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th> */}
                  <th
                    className={`px-6 py-3 text-center text-xs font-medium ${theme.textMuted} tracking-wider`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.map((item, index) => (
                  <tr
                    key={`${item.medicineName}-${index}`}
                    className={`${theme.borderSecondary} border-b hover:bg-opacity-50 ${theme.cardSecondary} transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center cursor-pointer">
                        {/* <div
                          className={`w-10 h-10 rounded-full ${theme.cardSecondary} flex items-center justify-center mr-3`}
                        >
                          <Pill className="w-5 h-5 text-emerald-500" />
                        </div> */}
                        <div
                          onClick={() =>
                            navigate(`/${role}/all-stocks/${item.medicineName}`)
                          }
                        >
                          <div className={`font-medium ${theme.textPrimary}`}>
                            {item.medicineName}
                          </div>
                          {/* <div className={`text-sm ${theme.textMuted}`}>
                            {item.batches.length} batch{item.batches.length !== 1 ? 'es' : ''}
                          </div> */}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-28">
                      <div className="flex flex-col items-center">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
                          <div
                            className={`h-2 rounded-full ${
                              item.totalQuantity > item.reorderLevel * 5
                                ? "bg-emerald-500"
                                : item.totalQuantity > item.reorderLevel * 2
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                (item.totalQuantity /
                                  (item.reorderLevel * 10)) *
                                  100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <span
                          className={`text-xs ${
                            item.totalQuantity > item.reorderLevel * 5
                              ? "text-emerald-500"
                              : item.totalQuantity > item.reorderLevel * 2
                              ? "text-amber-500"
                              : "text-red-500"
                          }`}
                        >
                          {item.totalQuantity} units
                        </span>
                      </div>
                    </td>
                    <td
                      className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                    >
                      PKR {item.avgPrice.toFixed(2)}
                    </td>
                    <td
                      className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                    >
                      PRK {item.totalValue.toLocaleString()}
                    </td>
                    <td
                      className={`px-6 py-4 text-center min-w-40 text-sm ${theme.textSecondary}`}
                    >
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        <span>{item.lastBatch.batchNumber || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-36 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === "In Stock"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    {/* <td className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}>
                      {item.reorderLevel} units
                    </td> */}
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          title="View Batches"
                          className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
                          onClick={() =>
                            navigate(`/${role}/all-stocks/${item.medicineName}`)
                          }
                        >
                          <Eye className="w-4 h-4 text-blue-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                  ? `No medicines found matching "${searchTerm}"`
                  : "No medicine entries found"}
              </h3>
              <p className={`${theme.textMuted} mb-4`}>
                {searchTerm
                  ? "Try adjusting your search terms or clear the search"
                  : "Add new stock items to see them here"}
              </p>
            </div>
          )}
        </div>

        {paginationData && medicines.length > 0 && (
          <Pagination
            currentPage={paginationData.currentPage}
            totalPages={paginationData.totalPages}
            totalItems={paginationData.totalItems}
            itemsPerPage={paginationData.itemsPerPage}
            hasNextPage={paginationData.hasNextPage}
            hasPrevPage={paginationData.hasPrevPage}
            onPageChange={(page) => setCurrentPage(page)}
            onLimitChange={(limit) => {
              setItemsPerPage(limit);
              setCurrentPage(1); // Reset to first page when changing limit
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default AllStocks;
