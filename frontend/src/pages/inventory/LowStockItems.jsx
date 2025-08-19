// src/pages/LowStockItems.jsx
import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Package,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Box,
  ChevronLeft,
  ShoppingCart,
  ArrowDownCircle,
  ArrowUpCircle
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import Pagination from "../../components/UI/Pagination";
import { useNavigate } from "react-router-dom";
import { getLowStockItems } from "../../api/api";

const LowStockItems = () => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allItems, setAllItems] = useState([]); // Store all items for client-side operations
  
  const navigate = useNavigate();

  // Fetch all low stock items (no pagination on server)
  const fetchLowStockItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all items without pagination parameters
      const response = await getLowStockItems({
        sortBy: 'name',
        sortOrder: 'asc'
      });
      
      if (response.success) {
        setAllItems(response.data.items);
      } else {
        setError('Failed to fetch low stock items');
      }
    } catch (err) {
      console.error('Error fetching low stock items:', err);
      setError(err?.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchLowStockItems();
  }, []);

  // Client-side filtering and sorting
  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...allItems];

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort items
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle special cases
        if (sortConfig.key === 'earliestExpiry') {
          const aEarliest = a.batches.length > 0 
            ? Math.min(...a.batches.map(batch => new Date(batch.expiryDate).getTime()))
            : Infinity;
          const bEarliest = b.batches.length > 0 
            ? Math.min(...b.batches.map(batch => new Date(batch.expiryDate).getTime()))
            : Infinity;
          aValue = aEarliest;
          bValue = bEarliest;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [allItems, searchTerm, sortConfig]);

  // Client-side pagination
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedItems, currentPage, itemsPerPage]);

  // Pagination info
  const totalItems = filteredAndSortedItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Toggle row expansion
  const toggleRowExpansion = (medicineId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [medicineId]: !prev[medicineId],
    }));
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchLowStockItems();
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleLimitChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page
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
      totalLowStockItems: filteredAndSortedItems.length,
      totalShortage: 0,
      totalBatches: 0,
      criticalItems: 0
    };
    
    filteredAndSortedItems.forEach(item => {
      if (item.shortage) summary.totalShortage += item.shortage;
      summary.totalBatches += item.batches.length;
      if ((item.shortage && item.shortage > 10) || item.currentStock < 5) {
        summary.criticalItems++;
      }
    });
    
    return summary;
  };

  const summary = calculateSummary();

  // Summary cards
  const summaryCards = [
    {
      title: "Total Low Stock Items",
      value: summary.totalLowStockItems,
      icon: Box,
      color: "text-amber-500",
      bgColor: "bg-amber-500 bg-opacity-20 border-amber-500",
    },
    {
      title: "Total Batches",
      value: summary.totalBatches,
      icon: Package,
      color: "text-blue-500",
      bgColor: "bg-blue-500 bg-opacity-20 border-blue-500",
    },
    {
      title: "Critical Items",
      value: summary.criticalItems,
      icon: AlertTriangle,
      color: "text-purple-500",
      bgColor: "bg-purple-500 bg-opacity-20 border-purple-500",
    },
  ];

  // Calculate days until expiry
  const calculateDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = Math.max(0, expiry - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <RefreshCw className={`w-8 h-8 ${theme.textMuted} animate-spin`} />
          <span className={`ml-2 ${theme.textMuted}`}>Loading low stock items...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && allItems.length === 0) {
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
      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center space-x-2 py-2 px-2 ${theme.cardSecondary} hover:bg-opacity-70 transition-colors rounded-lg`}
        >
          <ChevronLeft className={`w-5 h-5 ${theme.textPrimary}`} />
          <span className={theme.textPrimary}>Back to Dashboard</span>
        </button>
      </motion.div>

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
              Low Stock Items
            </h1>
            <p className={`${theme.textMuted}`}>
              Monitor and manage items below reorder levels
            </p>
          </div>
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
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
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
          <div className="mb-6">
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
              />
              <input
                type="text"
                placeholder="Search low stock items..."
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
                    onClick={() => requestSort('currentStock')}
                  >
                    <span className={`${theme.textMuted} tracking-wider`}>
                      Current Stock
                    </span>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer hover:bg-opacity-50"
                    onClick={() => requestSort('reorderLevel')}
                  >
                    <span className={`${theme.textMuted} tracking-wider`}>
                      Reorder Level
                    </span>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer hover:bg-opacity-50"
                    onClick={() => requestSort('earliestExpiry')}
                  >
                    <span className={`${theme.textMuted} tracking-wider`}>
                    Expiry
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedItems.map((item) => {
                  const isExpanded = expandedRows[item._id];
                  // Find earliest expiry date
                  const earliestBatch = [...item.batches].sort((a, b) => 
                    new Date(a.expiryDate) - new Date(b.expiryDate)
                  )[0];
                  const daysUntilExpiry = earliestBatch ? calculateDaysUntilExpiry(earliestBatch.expiryDate) : null;
                  
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
                                (item.shortage && item.shortage > 10) || item.currentStock < 5 
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
                            item.currentStock < 5 
                              ? "text-red-500" 
                              : theme.textPrimary
                          }`}
                        >
                          {item.currentStock} units
                        </td>
                        <td
                          className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                        >
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            <span>{item.batches.length} batches</span>
                          </div>
                        </td>
                        <td
                          className={`px-6 py-4 text-center text-sm ${
                            daysUntilExpiry !== null && daysUntilExpiry < 30
                              ? "text-amber-500"
                              : theme.textSecondary
                          }`}
                        >
                          {earliestBatch ? (
                            <div className="flex flex-col items-center">
                              <span>{formatDate(earliestBatch.expiryDate)}</span>
                              {daysUntilExpiry !== null && (
                                <span className={`text-xs ${
                                  daysUntilExpiry < 30 ? "text-amber-500" : "text-gray-500"
                                }`}>
                                  ({daysUntilExpiry} days left)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span>N/A</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded batch details row */}
                      {isExpanded && item.batches && (
                        <tr className={`${theme.borderSecondary} border-b`}>
                          <td colSpan="7" className="px-4 py-4 bg-gray-50 dark:bg-gray-800 bg-opacity-50">
                            <div className="pl-16 pr-4">
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-full">
                                  <thead>
                                    <tr className={`${theme.borderSecondary} border-b`}>
                                      <th className="px-4 py-2 text-left text-xs font-medium">
                                        Batch Number
                                      </th>
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
                                        Days Until Expiry
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.batches.map((batch, idx) => {
                                      const daysLeft = calculateDaysUntilExpiry(batch.expiryDate);
                                      return (
                                        <tr 
                                          key={idx}
                                          className={`${idx % 2 === 0 ? theme.cardSecondary : ''} ${theme.borderSecondary} border-b`}
                                        >
                                          <td className="px-4 py-3 text-sm">
                                            {batch.batchNumber}
                                          </td>
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
                                            daysLeft < 30 ? "text-amber-500" : ""
                                          }`}>
                                            {daysLeft} days
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
          {paginatedItems.length === 0 && !loading && (
            <div className="text-center py-12">
              <ShoppingCart
                className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`}
              />
              <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
                {searchTerm
                  ? `No low stock items found matching "${searchTerm}"`
                  : "No low stock items found"}
              </h3>
              <p className={`${theme.textMuted}`}>
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "All items are above reorder levels"}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        )}
      </motion.div>
    </div>
  );
};

export default LowStockItems;