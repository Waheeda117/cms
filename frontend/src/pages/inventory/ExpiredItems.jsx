import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CalendarX,
  Search,
  Trash2,
  Package,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  RefreshCw,
  User,
  DollarSign,
  History
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import Modal from "../../components/UI/Modal";
import Pagination from "../../components/UI/Pagination";
import { useNavigate } from "react-router-dom";

import { 
  getAllExpiredMedicines, 
  discardExpiredMedicineFromAllBatches,
  getDiscardHistory
} from "../../api/api";

const ExpiredItems = () => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});
  const [loading, setLoading] = useState(true);
  const [discardLoading, setDiscardLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    expiredMedicines: [],
    pagination: {},
    summary: {}
  });
  
  // Discard history state
  const [activeTab, setActiveTab] = useState('expired'); // 'expired' or 'history'
  const [discardHistoryData, setDiscardHistoryData] = useState({
    discardRecords: [],
    pagination: {},
    summary: {}
  });
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  
  const itemsPerPage = 100000;
  const navigate = useNavigate();
  

  // Fetch expired medicines data
  const fetchExpiredMedicines = async (page = 1, search = "") => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page,
        limit: itemsPerPage,
        search: search,
        sortBy: sortConfig.key || 'medicineName',
        sortOrder: sortConfig.direction === 'ascending' ? 'asc' : 'desc'
      };

      const response = await getAllExpiredMedicines(params);
      
      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to fetch expired medicines data');
      }
    } catch (err) {
      console.error('Error fetching expired medicines:', err);
      setError(err?.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch discard history data
  const fetchDiscardHistory = async (page = 1, search = "") => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      
      const params = {
        page: page,
        limit: itemsPerPage,
        search: search,
        sortBy: sortConfig.key || 'discardedAt',
        sortOrder: sortConfig.direction === 'ascending' ? 'asc' : 'desc'
      };

      const response = await getDiscardHistory(params);
      
      if (response.success) {
        setDiscardHistoryData(response.data);
      } else {
        setHistoryError('Failed to fetch discard history data');
      }
    } catch (err) {
      console.error('Error fetching discard history:', err);
      setHistoryError(err?.response?.data?.message || 'Failed to fetch data');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (activeTab === 'expired') {
      fetchExpiredMedicines(currentPage, searchTerm);
    } else {
      fetchDiscardHistory(currentPage, searchTerm);
    }
  }, [currentPage, activeTab]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        if (activeTab === 'expired') {
          fetchExpiredMedicines(1, searchTerm);
        } else {
          fetchDiscardHistory(1, searchTerm);
        }
      } else {
        setCurrentPage(1); // This will trigger useEffect above
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, activeTab]);

  // Handle sort changes
  useEffect(() => {
    if (sortConfig.key) {
      if (activeTab === 'expired') {
        fetchExpiredMedicines(currentPage, searchTerm);
      } else {
        fetchDiscardHistory(currentPage, searchTerm);
      }
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
    if (activeTab === 'expired') {
      fetchExpiredMedicines(currentPage, searchTerm);
    } else {
      fetchDiscardHistory(currentPage, searchTerm);
    }
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

  // Handle discard action
  const handleDiscardClick = (medicine) => {
    setSelectedMedicine(medicine);
    setIsDiscardModalOpen(true);
  };

  // Handle discard confirmation
  const handleDiscardConfirm = async () => {
    if (!selectedMedicine) return;

    try {
      setDiscardLoading(true);
      
      const discardData = {
        medicineId: selectedMedicine.medicineId,
        medicineName: selectedMedicine.medicineName,
        reason: "Expired - All Batches Discarded via Dashboard"
      };

      const response = await discardExpiredMedicineFromAllBatches(discardData);
      
      if (response.success) {
        // Close modal
        setIsDiscardModalOpen(false);
        setSelectedMedicine(null);
        
        // Refresh data
        if (activeTab === 'expired') {
          await fetchExpiredMedicines(currentPage, searchTerm);
        }
        await fetchDiscardHistory(1, ''); // Refresh history to show new record
      } else {
        setError(response.message || 'Failed to discard expired medicine');
      }
    } catch (err) {
      console.error('Error discarding medicine:', err);
      setError(err?.response?.data?.message || 'Failed to discard expired medicine');
    } finally {
      setDiscardLoading(false);
    }
  };

  const { expiredMedicines, summary, pagination } = data;

  // Summary cards for expired items
  const expiredSummaryCards = [
    {
      title: "Total Expired Medicines",
      value: summary.totalExpiredMedicines || 0,
      icon: Package,
      color: "text-red-500",
      bgColor: "bg-red-500 bg-opacity-20 border-red-500",
    },
    {
      title: "Total Expired Quantity",
      value: summary.totalExpiredQuantity || 0,
      icon: CalendarX,
      color: "text-orange-500",
      bgColor: "bg-orange-500 bg-opacity-20 border-orange-500",
    },
    {
      title: "Total Expired Value",
      value: `Rs.${summary.totalExpiredValue || 0}`,
      icon: AlertCircle,
      color: "text-purple-500",
      bgColor: "bg-purple-500 bg-opacity-20 border-purple-500",
    },
    {
      title: "Batches Affected",
      value: summary.totalBatchesAffected || 0,
      icon: Package,
      color: "text-blue-500",
      bgColor: "bg-blue-500 bg-opacity-20 border-blue-500",
    },
  ];

  // Summary cards for discard history
  const historySummaryCards = [
    {
      title: "Total Discarded Records",
      value: discardHistoryData.summary.totalDiscardRecords || 0,
      icon: Trash2,
      color: "text-red-500",
      bgColor: "bg-red-500 bg-opacity-20 border-red-500",
    },
    {
      title: "Total Discarded Quantity",
      value: discardHistoryData.summary.totalDiscardedQuantity || 0,
      icon: Package,
      color: "text-orange-500",
      bgColor: "bg-orange-500 bg-opacity-20 border-orange-500",
    },
    {
      title: "Total Discarded Value",
      value: `Rs.${discardHistoryData.summary.totalDiscardedValue || 0}`,
      icon: DollarSign,
      color: "text-purple-500",
      bgColor: "bg-purple-500 bg-opacity-20 border-purple-500",
    },
    {
      title: "Unique Medicines",
      value: discardHistoryData.summary.uniqueMedicinesDiscarded || 0,
      icon: Package,
      color: "text-blue-500",
      bgColor: "bg-blue-500 bg-opacity-20 border-blue-500",
    },
  ];

  // Loading state
  if (loading && activeTab === 'expired' && expiredMedicines.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <RefreshCw className={`w-8 h-8 ${theme.textMuted} animate-spin`} />
          <span className={`ml-2 ${theme.textMuted}`}>Loading expired medicines...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && activeTab === 'expired' && expiredMedicines.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className={`w-16 h-16 text-red-500 mx-auto mb-4`} />
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
              Expired Medicines
            </h1>
            <p className={`${theme.textMuted}`}>
              View and manage expired medicines across all batches
            </p>
          </div>
          {/* <button
            onClick={handleRefresh}
            disabled={loading || historyLoading}
            className={`p-3 ${theme.cardSecondary} rounded-lg hover:bg-opacity-70 transition-colors ${(loading || historyLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-5 h-5 ${theme.textMuted} ${(loading || historyLoading) ? 'animate-spin' : ''}`} />
          </button> */}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm flex items-center ${
            activeTab === 'expired'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('expired')}
        >
          <CalendarX className="w-4 h-4 mr-2" />
          Expired Medicines
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm flex items-center ${
            activeTab === 'history'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('history')}
        >
          <History className="w-4 h-4 mr-2" />
          Discard History
        </button>
      </div>

      {/* Error Banner */}
      {(error || historyError) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
        >
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error || historyError}</span>
            <button
              onClick={() => setError(null) || setHistoryError(null)}
              className="ml-auto text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}

      {/* Expired Medicines Tab */}
      {activeTab === 'expired' && (
        <>
          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {expiredSummaryCards.map((card, index) => (
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
                    placeholder="Search expired medicines..."
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
                        onClick={() => requestSort('medicineName')}
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
                      <th className="px-6 py-3 text-center text-xs font-medium">
                        <span className={`${theme.textMuted} tracking-wider`}>
                          Avg. Price
                        </span>
                      </th>
                      <th 
                        className="px-6 py-3 text-center text-xs font-medium cursor-pointer hover:bg-opacity-50"
                        onClick={() => requestSort('totalValue')}
                      >
                        <span className={`${theme.textMuted} tracking-wider`}>
                          Total Value
                        </span>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium">
                        <span className={`${theme.textMuted} tracking-wider`}>
                          Earliest Expiry
                        </span>
                      </th>
                      <th 
                        className="px-6 py-3 text-center text-xs font-medium cursor-pointer hover:bg-opacity-50"
                        onClick={() => requestSort('totalBatches')}
                      >
                        <span className={`${theme.textMuted} tracking-wider`}>
                          Batches
                        </span>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium">
                        <span className={`${theme.textMuted} tracking-wider`}>
                          Actions
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {expiredMedicines.map((medicine) => {
                      const isExpanded = expandedRows[medicine.medicineId];
                      return (
                        <React.Fragment key={medicine.medicineId}>
                          {/* Main row */}
                          <tr
                            className={`${theme.borderSecondary} border-b hover:bg-opacity-50 ${theme.cardSecondary} transition-colors`}
                          >
                            <td className="px-2 py-4 text-center">
                              <button
                                onClick={() => toggleRowExpansion(medicine.medicineId)}
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
                                  <Package className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                  <div className={`font-medium ${theme.textPrimary}`}>
                                    {medicine.medicineName}
                                  </div>
                                  {/* <div className={`text-sm ${theme.textMuted}`}>
                                    ID: {medicine.medicineId}
                                  </div> */}
                                </div>
                              </div>
                            </td>
                            <td
                              className={`px-6 py-4 text-center text-sm font-semibold text-red-500`}
                            >
                              {medicine.totalQuantity} units
                            </td>
                            <td
                              className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                            >
                              Rs. {medicine.averagePrice?.toFixed(2) || '0.00'}
                            </td>
                            <td
                              className={`px-6 py-4 text-center text-sm font-semibold ${theme.textPrimary}`}
                            >
                              Rs. {medicine.totalValue}
                            </td>
                            <td
                              className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                            >
                              <div className="flex flex-col items-center">
                                <span>{formatDate(medicine.earliestExpiryDate)}</span>
                                <span className="text-xs text-red-500">
                                  ({medicine.batches?.[0]?.daysExpired || 0} days expired)
                                </span>
                              </div>
                            </td>
                            <td
                              className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                            >
                              <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                <span>{medicine.totalBatches} batches</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center">
                                <button
                                  title="Discard Expired Stock"
                                  onClick={() => handleDiscardClick(medicine)}
                                  className={`p-2 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
                                >
                                  <Trash2 className="w-5 h-5 text-red-500" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded batch details row */}
                          {isExpanded && medicine.batches && (
                            <tr className={`${theme.borderSecondary} border-b`}>
                              <td colSpan="8" className="px-4 py-4 bg-gray-50 dark:bg-gray-800 bg-opacity-50">
                                <div className="pl-16 pr-4">
                                  {/* <h3 className={`font-semibold ${theme.textPrimary} mb-3 flex items-center`}>
                                    <Package className="w-4 h-4 mr-2" />
                                    Batch Details
                                  </h3> */}
                                  
                                  <div className="overflow-x-auto">
                                    <table className="w-full min-w-full">
                                      <thead>
                                        <tr className={`${theme.borderSecondary} border-b`}>
                                          <th className="px-4 py-2 text-left text-xs font-medium">
                                            Batch Number
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium">
                                            Bill ID
                                          </th>
                                          <th className="px-4 py-2 text-center text-xs font-medium">
                                            Quantity
                                          </th>
                                          <th className="px-4 py-2 text-center text-xs font-medium">
                                            Unit Price
                                          </th>
                                          <th className="px-4 py-2 text-center text-xs font-medium">
                                            Total Amount
                                          </th>
                                          <th className="px-4 py-2 text-center text-xs font-medium">
                                            Expiry Date
                                          </th>
                                          <th className="px-4 py-2 text-center text-xs font-medium">
                                            Days Expired
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {medicine.batches.map((batch, idx) => (
                                          <tr 
                                            key={idx}
                                            className={`${idx % 2 === 0 ? theme.cardSecondary : ''} ${theme.borderSecondary} border-b`}
                                          >
                                            <td className="px-4 py-3 text-sm">
                                              {batch.batchNumber}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                              {batch.billID}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm text-red-500 font-medium">
                                              {batch.quantity}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm">
                                              Rs. {batch.price}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm font-medium">
                                              Rs. {batch.totalAmount}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm">
                                              {formatDate(batch.expiryDate)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm text-red-500 font-medium">
                                              {batch.daysExpired} days
                                            </td>
                                          </tr>
                                        ))}
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
              {expiredMedicines.length === 0 && !loading && (
                <div className="text-center py-12">
                  <CalendarX
                    className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`}
                  />
                  <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
                    {searchTerm
                      ? `No expired medicines found matching "${searchTerm}"`
                      : "No expired medicines found"}
                  </h3>
                  <p className={`${theme.textMuted}`}>
                    {searchTerm
                      ? "Try adjusting your search terms"
                      : "All medicines are within their validity period"}
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
        </>
      )}

      {/* Discard History Tab */}
      {activeTab === 'history' && (
        <>
          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {historySummaryCards.map((card, index) => (
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

          {/* Discard History Table */}
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
                    placeholder="Search discard history..."
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
                      <th className="px-6 py-3 text-left text-xs font-medium">
                        <span className={`${theme.textMuted} tracking-wider`}>
                          Medicine
                        </span>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium">
                        <span className={`${theme.textMuted} tracking-wider`}>
                          Batch
                        </span>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium">
                        <span className={`${theme.textMuted} tracking-wider`}>
                          Quantity
                        </span>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium">
                        <span className={`${theme.textMuted} tracking-wider`}>
                          Value
                        </span>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium">
                        <span className={`${theme.textMuted} tracking-wider`}>
                          Expiry Date
                        </span>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium">
                        <span className={`${theme.textMuted} tracking-wider`}>
                          Discarded At
                        </span>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium">
                        <span className={`${theme.textMuted} tracking-wider`}>
                          Discarded By
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {discardHistoryData.discardRecords.map((record) => (
                      <tr
                        key={record._id}
                        className={`${theme.borderSecondary} border-b hover:bg-opacity-50 ${theme.cardSecondary} transition-colors`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div
                              className={`w-10 h-10 rounded-full ${theme.cardSecondary} flex items-center justify-center mr-3`}
                            >
                              <Package className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                              <div className={`font-medium ${theme.textPrimary}`}>
                                {record.medicineName}
                              </div>
                              {/* <div className={`text-sm ${theme.textMuted}`}>
                                ID: {record.medicineId}
                              </div> */}
                            </div>
                          </div>
                        </td>
                        <td className={`px-6 py-4 text-left text-sm ${theme.textSecondary}`}>
                          {record.batchNumber}
                        </td>
                        <td
                          className={`px-6 py-4 text-center text-sm font-semibold text-red-500`}
                        >
                          {record.quantityDiscarded} units
                        </td>
                        <td
                          className={`px-6 py-4 text-center text-sm font-semibold ${theme.textPrimary}`}
                        >
                          Rs. {record.totalValue}
                        </td>
                        <td
                          className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                        >
                          {formatDate(record.expiryDate)}
                        </td>
                        <td
                          className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                        >
                          {formatDate(record.discardedAt)}
                        </td>
                        <td
                          className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                        >
                          <div className="flex items-center justify-center">
                            <User className="w-4 h-4 mr-1" />
                            {record.discardedBy?.username || 'Unknown'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Loading State */}
              {historyLoading && (
                <div className="flex items-center justify-center min-h-48">
                  <RefreshCw className={`w-8 h-8 ${theme.textMuted} animate-spin`} />
                  <span className={`ml-2 ${theme.textMuted}`}>
                    Loading discard history...
                  </span>
                </div>
              )}

              {/* Empty State */}
              {discardHistoryData.discardRecords.length === 0 && !historyLoading && (
                <div className="text-center py-12">
                  <Trash2
                    className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`}
                  />
                  <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
                    {searchTerm
                      ? `No discard records found matching "${searchTerm}"`
                      : "No discard history found"}
                  </h3>
                  <p className={`${theme.textMuted}`}>
                    {searchTerm
                      ? "Try adjusting your search terms"
                      : "Discard records will appear here once available"}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {discardHistoryData.pagination?.totalPages > 1 && (
              <Pagination
                currentPage={discardHistoryData.pagination.currentPage || 1}
                totalPages={discardHistoryData.pagination.totalPages || 1}
                onPageChange={setCurrentPage}
                className="mt-4"
              />
            )}
          </motion.div>
        </>
      )}

      {/* Discard Confirmation Modal */}
      <Modal
        isOpen={isDiscardModalOpen}
        onClose={() => !discardLoading && setIsDiscardModalOpen(false)}
        title="Discard Expired Stock"
        subtitle={`Medicine: ${selectedMedicine?.medicineName}`}
      >
        <div className="p-6">
          <div className="mb-6 text-center">
            <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
              Are you sure you want to discard this expired medicine?
            </h3>
            <p className={`${theme.textMuted}`}>
              This will permanently remove all expired stock from inventory across all batches.
            </p>
          </div>

          {selectedMedicine && (
            <div className={`${theme.cardSecondary} rounded-lg p-4 mb-6`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${theme.textMuted}`}>Medicine Name</p>
                  <p className={`font-medium ${theme.textPrimary}`}>
                    {selectedMedicine.medicineName}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${theme.textMuted}`}>Total Quantity</p>
                  <p className="font-medium text-red-500">
                    {selectedMedicine.totalQuantity} units
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${theme.textMuted}`}>Total Value</p>
                  <p className={`font-medium ${theme.textPrimary}`}>
                    Rs. {selectedMedicine.totalValue}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${theme.textMuted}`}>Batches Affected</p>
                  <p className={`font-medium ${theme.textPrimary}`}>
                    {selectedMedicine.totalBatches}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsDiscardModalOpen(false)}
              disabled={discardLoading}
              className={`px-4 py-2 ${theme.cardSecondary} ${theme.textPrimary} rounded-lg hover:bg-opacity-70 transition-colors ${discardLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Cancel
            </button>
            <button
              onClick={handleDiscardConfirm}
              disabled={discardLoading}
              className={`px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium rounded-lg shadow-lg hover:from-red-600 hover:to-orange-600 transition-all duration-200 flex items-center ${discardLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {discardLoading && (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              )}
              {discardLoading ? 'Discarding...' : 'Discard Expired Stock'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExpiredItems;