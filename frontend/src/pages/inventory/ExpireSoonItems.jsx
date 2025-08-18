// src/pages/ExpireSoonItems.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  Package,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Flame,
  AlertTriangle,
  CalendarX
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import Pagination from "../../components/UI/Pagination";
import { getExpireSoonItems } from "../../api/api";

const ExpireSoonItems = () => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    items: [],
    pagination: {},
  });
  
  const itemsPerPage = 100;

  // Fetch soon-to-expire items data
  const fetchExpireSoonItems = async (page = 1, search = "") => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page,
        limit: itemsPerPage,
        search: search,
        sortBy: sortConfig.key || 'daysLeft',
        sortOrder: sortConfig.direction === 'ascending' ? 'asc' : 'desc'
      };

      const response = await getExpireSoonItems(params);
      
      if (response.success) {
        setData({
          items: response.data.items,
          pagination: response.data.pagination
        });
      } else {
        setError('Failed to fetch soon-to-expire items');
      }
    } catch (err) {
      console.error('Error fetching soon-to-expire items:', err);
      setError(err?.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchExpireSoonItems(currentPage, searchTerm);
  }, [currentPage]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchExpireSoonItems(1, searchTerm);
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle sort changes
  useEffect(() => {
    if (sortConfig.key) {
      fetchExpireSoonItems(currentPage, searchTerm);
    }
  }, [sortConfig]);

  // Toggle row expansion
  const toggleRowExpansion = (medicineId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [medicineId]: !prev[medicineId],
    }));
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchExpireSoonItems(currentPage, searchTerm);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle sorting
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Calculate summary values
  const calculateSummary = () => {
    const summary = {
      totalItems: data.pagination.totalItems || 0,
      totalQuantity: 0,
      criticalItems: 0,
      totalBatches: 0
    };
    
    data.items.forEach(item => {
      summary.totalQuantity += item.totalQuantity;
      summary.totalBatches += item.batches.length;
      if (item.daysLeft <= 3) {
        summary.criticalItems++;
      }
    });
    
    return summary;
  };

  const summary = calculateSummary();
  const { items, pagination } = data;

  // Summary cards
  const summaryCards = [
    {
      title: "Total Items Expiring Soon",
      value: summary.totalItems,
      icon: CalendarClock,
      color: "text-amber-500",
      bgColor: "bg-amber-500 bg-opacity-20 border-amber-500",
    },
    {
      title: "Total Quantity",
      value: summary.totalQuantity,
      icon: Package,
      color: "text-blue-500",
      bgColor: "bg-blue-500 bg-opacity-20 border-blue-500",
    },
    {
      title: "Critical Items",
      value: summary.criticalItems,
      icon: Flame,
      color: "text-red-500",
      bgColor: "bg-red-500 bg-opacity-20 border-red-500",
    },
    {
      title: "Total Batches",
      value: summary.totalBatches,
      icon: Package,
      color: "text-purple-500",
      bgColor: "bg-purple-500 bg-opacity-20 border-purple-500",
    },
  ];

  // Calculate days until expiry for a batch
  const calculateDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = Math.max(0, expiry - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Loading state
  if (loading && items.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <RefreshCw className={`w-8 h-8 ${theme.textMuted} animate-spin`} />
          <span className={`ml-2 ${theme.textMuted}`}>Loading soon-to-expire items...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && items.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className={`w-16 h-16 text-red-500 mx-auto mb-4`} />
          <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
            Error Loading Data
          </h3>
          <p className={`${theme.textMuted} mb-4`}>{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${theme.textPrimary} mb-2`}>
              Items Expiring Soon
            </h1>
            <p className={`${theme.textMuted}`}>
              Monitor items that will expire within the next 10 days
            </p>
          </div>
          {/* <button
            onClick={handleRefresh}
            disabled={loading}
            className={`p-3 ${theme.cardSecondary} rounded-lg hover:bg-opacity-70 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-5 h-5 ${theme.textMuted} ${loading ? 'animate-spin' : ''}`} />
          </button> */}
        </div>
      </motion.div>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
        >
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {summaryCards.map((card, index) => (
          <div
            key={index}
            className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${theme.textMuted}`}>
                  {card.title}
                </p>
                <p className={`text-2xl font-bold ${theme.textPrimary} mt-2`}>
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor} border`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
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
          {/* Search */}
          {/* <div className="mb-6">
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
              />
              <input
                type="text"
                placeholder="Search soon-to-expire items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
              />
            </div>
          </div> */}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${theme.borderSecondary} border-b`}>
                  <th className="px-6 py-3 text-left text-xs font-medium w-10">
                    {/* Expand column header */}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium cursor-pointer hover:bg-opacity-50"
                    onClick={() => requestSort('name')}
                  >
                    <span className={`${theme.textMuted} tracking-wider`}>
                      Medicine
                    </span>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer hover:bg-opacity-50"
                    onClick={() => requestSort('totalQuantity')}
                  >
                    <span className={`${theme.textMuted} tracking-wider`}>
                      Total Quantity
                    </span>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer hover:bg-opacity-50"
                    onClick={() => requestSort('earliestExpiry')}
                  >
                    <span className={`${theme.textMuted} tracking-wider`}>
                      Earliest Expiry
                    </span>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer hover:bg-opacity-50"
                    onClick={() => requestSort('daysLeft')}
                  >
                    <span className={`${theme.textMuted} tracking-wider`}>
                      Days Left
                    </span>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer hover:bg-opacity-50"
                    onClick={() => requestSort('batches')}
                  >
                    <span className={`${theme.textMuted} tracking-wider`}>
                      Batches
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => {
                  const isExpanded = expandedRows[item._id];
                  const daysLeft = item.daysLeft;
                  
                  return (
                    <React.Fragment key={item._id}>
                      {/* Main row */}
                      <tr
                        className={`${theme.borderSecondary} border-b hover:bg-opacity-50 ${theme.cardSecondary} transition-colors`}
                      >
                        <td className="px-2 py-4 text-center">
                          <button
                            onClick={() => toggleRowExpansion(item._id)}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-blue-500" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-blue-500" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div
                              className={`w-10 h-10 rounded-full ${theme.cardSecondary} flex items-center justify-center mr-3`}
                            >
                              <Package className={`w-5 h-5 ${
                                daysLeft <= 3 
                                  ? "text-red-500" 
                                  : "text-amber-500"
                              }`} />
                            </div>
                            <div>
                              <div className={`font-medium ${theme.textPrimary}`}>
                                {item.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td
                          className={`px-6 py-4 text-center text-sm font-semibold ${
                            daysLeft <= 3 
                              ? "text-red-500" 
                              : theme.textPrimary
                          }`}
                        >
                          {item.totalQuantity} units
                        </td>
                        <td
                          className={`px-6 py-4 text-center text-sm ${
                            daysLeft <= 3 
                              ? "text-red-500" 
                              : theme.textSecondary
                          }`}
                        >
                          {item.earliestExpiry ? formatDate(item.earliestExpiry) : 'N/A'}
                        </td>
                        <td
                          className={`px-6 py-4 text-center text-sm font-semibold`}
                        >
                          <div className={`inline-flex items-center px-3 py-1 rounded-full ${
                            daysLeft <= 3 
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" 
                              : daysLeft <= 7 
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" 
                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}>
                            {daysLeft} days
                          </div>
                        </td>
                        <td
                          className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                        >
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            <span>{item.batches.length} batches</span>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded batch details row */}
                      {isExpanded && item.batches && (
                        <tr className={`${theme.borderSecondary} border-b`}>
                          <td colSpan="6" className="px-4 py-4 bg-gray-50 dark:bg-gray-800 bg-opacity-50">
                            <div className="pl-16 pr-4">
                              <h3 className={`font-semibold ${theme.textPrimary} mb-3 flex items-center`}>
                                <Package className="w-4 h-4 mr-2" />
                                Batch Details
                              </h3>
                              
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-full">
                                  <thead>
                                    <tr className={`${theme.borderSecondary} border-b`}>
                                      <th className="px-4 py-2 text-left text-xs font-medium">
                                        Batch Number
                                      </th>
                                      {/* <th className="px-4 py-2 text-left text-xs font-medium">
                                        Bill ID
                                      </th> */}
                                      <th className="px-4 py-2 text-center text-xs font-medium">
                                        Quantity
                                      </th>
                                      <th className="px-4 py-2 text-center text-xs font-medium">
                                        Unit Price
                                      </th>
                                      <th className="px-4 py-2 text-center text-xs font-medium">
                                        Expiry Date
                                      </th>
                                      <th className="px-4 py-2 text-center text-xs font-medium">
                                        Days Left
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.batches.map((batch, idx) => {
                                      const batchDaysLeft = calculateDaysUntilExpiry(batch.expiryDate);
                                      
                                      return (
                                        <tr 
                                          key={idx}
                                          className={`${idx % 2 === 0 ? theme.cardSecondary : ''} ${theme.borderSecondary} border-b`}
                                        >
                                          <td className="px-4 py-3 text-sm">
                                            {batch.batchNumber}
                                          </td>
                                          {/* <td className="px-4 py-3 text-sm">
                                            {batch.billID || 'N/A'}
                                          </td> */}
                                          <td className="px-4 py-3 text-center text-sm font-medium">
                                            {batch.quantity}
                                          </td>
                                          <td className="px-4 py-3 text-center text-sm">
                                            Rs. {batch.price}
                                          </td>
                                          <td className="px-4 py-3 text-center text-sm">
                                            {formatDate(batch.expiryDate)}
                                          </td>
                                          <td className={`px-4 py-3 text-center text-sm font-medium ${
                                            batchDaysLeft <= 3 
                                              ? "text-red-500" 
                                              : batchDaysLeft <= 7 
                                                ? "text-amber-500" 
                                                : "text-green-500"
                                          }`}>
                                            {batchDaysLeft} days
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {items.length === 0 && !loading && (
            <div className="text-center py-12">
              <CalendarX
                className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`}
              />
              <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
                {searchTerm
                  ? `No soon-to-expire items found matching "${searchTerm}"`
                  : "No items expiring soon found"}
              </h3>
              <p className={`${theme.textMuted}`}>
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "All items are within safe expiry dates"}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.currentPage || 1}
            totalPages={pagination.totalPages || 1}
            onPageChange={setCurrentPage}
            className="mt-4"
          />
        )}
      </motion.div>
    </div>
  );
};

export default ExpireSoonItems;