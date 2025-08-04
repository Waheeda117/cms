import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Pill,
  AlertCircle,
  CalendarX,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Box,
  Gauge,
  ArrowDownUp,
  Folders,
  FileEdit,
  Check
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { getStocksData, deleteStockById } from "../../api/api";
import AddStockModal from "../../components/inventory/AddStockModal";
import ConfirmDeleteModal from "../../components/inventory/ConfirmDeleteModal";
import { useNavigate } from "react-router-dom";
import formatDate from "../../utils/date.js";
import { useAuthStore } from "../../store/authStore";
import Pagination from "../../components/UI/Pagination.jsx";

const Stocks = () => {
  const { theme } = useTheme();
  const [allStockData, setAllStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [allBatches, setAllBatches] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [paginationData, setPaginationData] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // New state for tabs


  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const navigate = useNavigate();

  const handleDeleteClick = (batch) => {
    setSelectedStock(batch);
    setDeleteModalOpen(true);
  };

  const handleDeleteSuccess = (deletedBatchId) => {
    setAllStockData((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        batches: prev.data.batches.filter(
          (batch) => batch._id !== deletedBatchId
        ),
        summary: {
          ...prev.data.summary,
          totalBatches: prev.data.summary.totalBatches - 1,
        },
      },
    }));
    setDeleteModalOpen(false);
  };

  const handleStockAdded = () => {
    fetchData();
    setIsModalOpen(false);
  };

  const fetchData = async (
    page = currentPage,
    limit = itemsPerPage,
    search = searchTerm
  ) => {
    try {
      setLoading(true);
      const data = await getStocksData(page, limit, search);
      setAllStockData(data);
      setPaginationData(data.data.pagination);
    } catch (err) {
      setError("Failed to fetch inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, itemsPerPage, searchTerm);
  }, [currentPage, itemsPerPage]);

  const batches = allStockData?.data?.batches || [];

  // Inside fetchData after setting allStockData:
  useEffect(() => {
    if (allStockData && allStockData.data?.batches) {
      const batches = allStockData.data.batches.map((batch) => ({
        batchNumber: batch.batchNumber,
        billID: batch.billID,
      }));
      setAllBatches(batches);
    }
  }, [allStockData]);

  const handleAddStock = () => {
    setIsModalOpen(true);
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Frontend filtering and sorting
  const filteredAndSortedBatches = useMemo(() => {
    if (!allStockData || !allStockData.data?.batches) return [];

    let batches = [...allStockData.data.batches];


        // Apply tab filter
    if (activeTab === 'drafts') {
      batches = batches.filter(batch => batch.isDraft);
    } else if (activeTab === 'finalized') {
      batches = batches.filter(batch => !batch.isDraft);
    }

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      batches = batches.filter(
        (batch) =>
          batch.batchNumber.toLowerCase().includes(lowerSearch) ||
          batch.billID.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      batches.sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === "summary.totalMedicines") {
          aValue = a.summary.totalMedicines;
          bValue = b.summary.totalMedicines;
        } else if (sortConfig.key === "summary.totalQuantity") {
          aValue = a.summary.totalQuantity;
          bValue = b.summary.totalQuantity;
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        // Convert to number if possible
        if (typeof aValue === "string" && !isNaN(aValue)) {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return batches;
  }, [allStockData, searchTerm, sortConfig, activeTab]);

  // Summary cards data
  const summaryCards = [
    {
      title: "Total Batches",
      value: allStockData?.data?.summary?.totalBatches || 0,
      icon: Box,
      color: "text-blue-500",
      bgColor: "bg-blue-500 bg-opacity-20 border-blue-500",
    },
    {
      title: "Total Medicines",
      value: allStockData?.data?.summary?.totalMedicines || 0,
      icon: Pill,
      color: "text-green-500",
      bgColor: "bg-green-500 bg-opacity-20 border-green-500",
    },
    {
      title: "Low Stock Batches",
      value: allStockData?.data?.summary?.batchesWithLowStock || 0,
      icon: Gauge,
      color: "text-orange-500",
      bgColor: "bg-orange-500 bg-opacity-20 border-orange-500",
    },
    {
      title: "Expired Batches",
      value: allStockData?.data?.summary?.batchesWithExpiredItems || 0,
      icon: CalendarX,
      color: "text-red-500",
      bgColor: "bg-red-500 bg-opacity-20 border-red-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

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
          Batch Inventory Management
        </h1>
        <p className={`${theme.textMuted}`}>
          Manage medicine stock levels by batches
        </p>
      </motion.div>

      {/* Summary Cards */}
      {/* <motion.div
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
                <p className={`text-3xl font-bold ${theme.textPrimary} mt-2`}>
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor} border`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </motion.div> */}

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
      >
        <div className="p-6">
          {/* Header with Add Button */}
          <div className="flex flex-col sm:flex-row gap-5 justify-between items-start mb-6">
            <div>
              <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>
                Medicine Stock - Batch View
              </h2>
              <p className={`${theme.textMuted}`}>
                View and manage medicine batches
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddStock}
              className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200`}
            >
              <Plus className="w-5 h-5" />
              <span>Add Batch</span>
            </motion.button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
              />
              <input
                type="text"
                placeholder="Search batches..."
                value={searchTerm}
                onChange={handleSearch}
                className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
              />
            </div>
          </div>

                    {/* Tabs Filter */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'all'
                    ? `bg-gradient-to-r ${theme.buttonGradient} text-white shadow-lg`
                    : `${theme.cardOpacity} ${theme.border} border hover:${theme.cardSecondary}`
                }`}
              >
                All Batches
              </button>
              <button
                onClick={() => setActiveTab('drafts')}
                className={`px-4 py-2 rounded-lg font-medium flex items-center transition-colors ${
                  activeTab === 'drafts'
                    ? `bg-gradient-to-r ${theme.buttonGradient} text-white shadow-lg`
                    : `${theme.cardOpacity} ${theme.border} border hover:${theme.cardSecondary}`
                }`}
              >
                {/* <FileEdit className="w-4 h-4 mr-1" /> */}
                Drafts
              </button>
              <button
                onClick={() => setActiveTab('finalized')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'finalized'
                    ? `bg-gradient-to-r ${theme.buttonGradient} text-white shadow-lg`
                    : `${theme.cardOpacity} ${theme.border} border hover:${theme.cardSecondary}`
                }`}
              >
                Finalized
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className={`${theme.borderSecondary} border-b`}>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer w-1/5"
                    onClick={() => requestSort("batchNumber")}
                  >
                    <div
                      className={`flex items-center justify-center ${theme.textPrimary}`}
                    >
                      <span className={`${theme.textMuted} tracking-wider`}>
                        Batch Number
                      </span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer w-1/5"
                    onClick={() => requestSort("billID")}
                  >
                    <div
                      className={`flex items-center ${theme.textPrimary} justify-center`}
                    >
                      <span className={`${theme.textMuted} tracking-wider`}>
                        Cheque Number
                      </span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer w-1/5"
                    onClick={() => requestSort("overallPrice")}
                  >
                    <div
                      className={`flex items-center ${theme.textPrimary} justify-center`}
                    >
                      <span className={`${theme.textMuted} tracking-wider`}>
                        Total Price
                      </span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium cursor-pointer w-1/5"
                    onClick={() => requestSort("updatedAt")}
                  >
                    <div
                      className={`flex items-center ${theme.textPrimary} justify-center`}
                    >
                      <span className={`${theme.textMuted} tracking-wider`}>
                        Last Modified
                      </span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  

                  <th
                    className={`px-6 py-3 text-center text-xs font-medium ${theme.textMuted} tracking-wider w-1/6`}
                  >
                    Status
                  </th>

                  <th
                    className={`px-6 py-3 text-center text-xs font-medium ${theme.textMuted} tracking-wider w-1/5`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedBatches.map((batch) => {
                  const hasMiscAmount = batch.miscellaneousAmount !== 0;
                  const miscAmountSign =
                    batch.miscellaneousAmount > 0 ? "+" : "-";
                  const miscAmountColor =
                    batch.miscellaneousAmount > 0
                      ? "text-yellow-500"
                      : "text-red-500";

                  return (
                    <tr
                      key={batch._id}
                      className={`${theme.borderSecondary} border-b hover:bg-opacity-50 ${theme.cardSecondary} transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div
                            className={`w-10 h-10 rounded-full ${theme.cardSecondary} flex items-center justify-center mr-3`}
                          >
                            <Folders className="w-5 h-5 text-blue-500" />
                          </div>
                          <div
                            className="cursor-pointer"
                            onClick={() =>
                              navigate(
                                `/${user.role}/inventory-management/${batch._id}`
                              )
                            }
                          >
                            <div className={`font-medium ${theme.textPrimary}`}>
                              {batch.batchNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                      >
                        {batch.billID}
                      </td>
                      <td
                        className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                      >
                        <div className="flex items-center justify-center">
                          PKR {batch.overallPrice}
                          {hasMiscAmount && (
                            <div className="ml-2 relative group inline-flex">
                              <div
                                className={`p-1 rounded-full ${miscAmountColor} bg-opacity-20`}
                              >
                                <AlertCircle
                                  className={`w-4 h-4 ${miscAmountColor}`}
                                />
                              </div>
                              <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded w-64 z-10 left-1/2 transform -translate-x-1/2 bottom-full mb-2">
                                Miscellaneous Amount: Rs.
                                {batch.miscellaneousAmount}
                                <br />
                                {batch.miscellaneousAmount > 0
                                  ? `Added to total price`
                                  : `Deducted from total price`}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      {/* <td
                        className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                      >
                        {formatDate(batch.createdAt)}
                      </td> */}
                      <td
                        className={`px-6 py-4 text-center text-sm ${theme.textSecondary}`}
                      >
                        {formatDate(batch.updatedAt)}
                      </td>

                                            {/* Status Cell */}
                      <td className="px-6 py-4 text-center">
                        {batch.isDraft ? (
                          <div className="flex items-center justify-center">
                            <div className="flex items-center text-blue-500">
                              {/* <FileEdit className="w-4 h-4 mr-1" /> */}
                              <span className="text-xs font-medium">Draft</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <div className="flex items-center text-green-500">
                              <span className="text-xs font-medium">Finalized</span>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center space-x-2">
                          <button
                            className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
                            onClick={() =>
                              navigate(
                                `/${user.role}/inventory-management/${batch._id}`
                              )
                            }
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </button>
                            <button
                              className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
                              onClick={() =>
                                navigate(`/update-batch/${batch._id}`)
                              }
                            >
                              <Edit className="w-4 h-4 text-green-500" />
                            </button>
                            <button
                              title="Delete Batch"
                              onClick={() => handleDeleteClick(batch)}
                              className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredAndSortedBatches.length === 0 && (
            <div className="text-center py-12">
              <Package
                className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`}
              />
              <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
                {searchTerm
                  ? `No batches found matching "${searchTerm}"`
                  : "No inventory batches found"}
              </h3>
              <p className={`${theme.textMuted} mb-4`}>
                {searchTerm
                  ? "Try adjusting your search terms or clear the search to see all batches"
                  : "Get started by adding your first batch"}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleAddStock}
                  className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200 mx-auto`}
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Batch</span>
                </button>
              )}
            </div>
          )}
        </div>

        {paginationData && batches.length > 0 && (
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
              setCurrentPage(1);
            }}
          />
        )}
      </motion.div>

      {/* Modals */}
      <AddStockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleStockAdded}
        existingBatches={allBatches}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        stockItem={selectedStock}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export default Stocks;
