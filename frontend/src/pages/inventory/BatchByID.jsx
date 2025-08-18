import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Pill,
  AlertCircle,
  CalendarX,
  Users,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Box,
  Gauge,
  CalendarCheck,
  BarChart2,
  ArrowDownUp,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  User,
  DollarSign,
  Package2,
  Clock,
  TrendingUp,
  Shield,
  Activity,
  Info,
  FileEdit
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useParams, useNavigate } from "react-router-dom";
import Modal from "../../components/UI/Modal.jsx";
import formatDate from "../../utils/date.js";
import { useAuthStore } from "../../store/authStore";
import { getBatchById } from "../../api/api";
import BatchActivityLogsModal from "./BatchActivityLogsModal.jsx";

// Helper function to calculate total medicine price
const calculateTotalMedicinePrice = (medicines) => {
  return medicines.reduce((total, medicine) => total + medicine.totalAmount, 0);
};

// Helper function to get medicine status
const getMedicineStatus = (medicine) => {
  const now = new Date();
  const expiryDate = new Date(medicine.expiryDate);
  const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

  if (medicine.quantity <= medicine.reorderLevel) {
    return { status: "Low Stock", color: "red", priority: 3 };
  } else if (daysUntilExpiry <= 30) {
    return { status: "Expiring Soon", color: "orange", priority: 2 };
  } else if (daysUntilExpiry <= 90) {
    return { status: "Warning", color: "yellow", priority: 1 };
  }
  return { status: "Good", color: "green", priority: 0 };
};

// Helper function to get batch overall status
const getBatchOverallStatus = (medicines) => {
  const statuses = medicines.map(getMedicineStatus);
  const maxPriority = Math.max(...statuses.map((s) => s.priority));

  if (maxPriority === 3) return { status: "Critical", color: "red" };
  if (maxPriority === 2) return { status: "Warning", color: "orange" };
  if (maxPriority === 1) return { status: "Caution", color: "yellow" };
  return { status: "Good", color: "green" };
};

const BatchByID = () => {
  const { theme } = useTheme();
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [batchData, setBatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "medicineName",
    direction: "asc",
  });
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);

  const [logsModalOpen, setLogsModalOpen] = useState(false);


  // Fetch batch data
  useEffect(() => {
    const fetchBatchData = async () => {
      try {
        setLoading(true);
        const data = await getBatchById(batchId);
        setBatchData(data.data);
      } catch (err) {
        setError("Failed to fetch batch data");
      } finally {
        setLoading(false);
      }
    };

    if (batchId) {
      fetchBatchData();
    }
  }, [batchId]);

  // Calculate derived data
  const totalMedicinePrice = batchData?.medicines
    ? calculateTotalMedicinePrice(batchData.medicines)
    : 0;

  const batchStatus = batchData?.medicines
    ? getBatchOverallStatus(batchData.medicines)
    : { status: "Loading...", color: "gray" };

  const hasMiscAmount = batchData?.miscellaneousAmount !== 0;
  const miscAmountSign = batchData?.miscellaneousAmount > 0 ? "+" : "-";
  const miscAmountColor =
    batchData?.miscellaneousAmount > 0 ? "text-yellow-500" : "text-red-500";

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort medicines
  const filteredAndSortedMedicines = React.useMemo(() => {
    if (!batchData?.medicines) return [];

    let medicines = [...batchData.medicines];

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      medicines = medicines.filter((medicine) =>
        medicine.medicineName.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      medicines.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Convert to number if possible
        if (typeof aValue === "string" && !isNaN(aValue)) {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        }

        if (sortConfig.key === "expiryDate") {
          aValue = new Date(a.expiryDate);
          bValue = new Date(b.expiryDate);
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

    return medicines;
  }, [batchData, searchTerm, sortConfig]);

  // Summary cards data
  const summaryCards = [
    {
      title: "Total Medicines",
      value: batchData?.medicines?.length || 0,
      icon: Pill,
      color: "text-blue-500",
      bgColor: "bg-blue-500 bg-opacity-20 border-blue-500",
    },
    {
      title: "Total Quantity",
      value:
        batchData?.medicines?.reduce((sum, med) => sum + med.quantity, 0) || 0,
      icon: Package2,
      color: "text-green-500",
      bgColor: "bg-green-500 bg-opacity-20 border-green-500",
    },
    {
      title: "Total Value",
      value: `PKR ${batchData?.overallPrice || 0}`,
      icon: DollarSign,
      color: "text-purple-500",
      bgColor: "bg-purple-500 bg-opacity-20 border-purple-500",
    },
    {
      title: "Batch Status",
      value: batchStatus.status,
      icon: Shield,
      color: `text-${batchStatus.color}-500`,
      bgColor: `bg-${batchStatus.color}-500 bg-opacity-20 border-${batchStatus.color}-500`,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !batchData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`text-center p-8 ${theme.cardOpacity} rounded-xl`}>
          <p className={`text-xl ${theme.textPrimary} mb-4`}>
            {error || "Batch not found"}
          </p>
          <button
            onClick={() => navigate(-1)}
            className={`px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-lg`}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 sm:p-6">
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
          <span className={theme.textPrimary}>Back to Inventory</span>
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
              Batch: {batchData.batchNumber}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <FileText className={`w-4 h-4 ${theme.textMuted}`} />
                <span className={theme.textMuted}>
                  Cheque Number: {batchData.billID}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <FileEdit className={`w-4 h-4 ${theme.textMuted}`} />
                <span className={theme.textMuted}>
                  Status: {batchData.isDraft ? 'Draft' : 'Finalized'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className={`w-4 h-4 ${theme.textMuted}`} />
                <span className={theme.textMuted}>
                  Created By: {batchData.createdBy.username}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className={`w-4 h-4 ${theme.textMuted}`} />
                <span className={theme.textMuted}>
                  Created: {formatDate(batchData.createdAt)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className={`w-4 h-4 ${theme.textMuted}`} />
                <span className={theme.textMuted}>
                  Updated: {formatDate(batchData.updatedAt)}
                </span>
              </div>
            </div>
          </div>

<div className="flex flex-wrap gap-2">
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => navigate(`/update-batch/${batchId}`)}
    className={`flex items-center space-x-2 px-4 py-2 ${theme.cardSecondary} hover:bg-opacity-70 transition-colors rounded-lg`}
  >
    <Edit className="w-4 h-4 text-blue-500" />
    <span className={theme.textPrimary}>Edit Batch</span>
  </motion.button>
  
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => setLogsModalOpen(true)}
    className={`flex items-center space-x-2 px-4 py-2 ${theme.cardSecondary} hover:bg-opacity-70 transition-colors rounded-lg`}
  >
    <Activity className="w-4 h-4 text-emerald-500" />
    <span className={theme.textPrimary}>View Logs</span>
  </motion.button>
</div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8"
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
                <p className={`text-xl sm:text-3xl font-bold ${theme.textPrimary} mt-2`}>
                  {card.value}
                </p>
              </div>
              <div className={`p-2 sm:p-3 rounded-full ${card.bgColor} border`}>
                <card.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${card.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div> */}

      {/* Price Breakdown */}
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
            Price Breakdown
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={theme.textSecondary}>Medicines Subtotal:</span>
              <span className={`font-semibold ${theme.textPrimary}`}>
                PKR {totalMedicinePrice}
              </span>
            </div>

            {hasMiscAmount && (
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className={theme.textSecondary}>
                    Miscellaneous Amount:
                  </span>
                  <div className="relative group">
                    <Info className={`w-4 h-4 ${theme.textMuted}`} />
                    <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded w-48 z-10 left-1/2 transform -translate-x-1/2 bottom-full mb-2">
                      {batchData.miscellaneousAmount > 0
                        ? "Miscellaneous Amount added to this batch"
                        : "Discount or adjustment deducted from the batch"}
                    </div>
                  </div>
                </div>
                <span className={`font-semibold ${miscAmountColor}`}>
                  {miscAmountSign}PKR {Math.abs(batchData.miscellaneousAmount)}
                </span>
              </div>
            )}

            <div
              className={`flex justify-between items-center pt-4 border-t ${theme.borderSecondary}`}
            >
              <span className={`font-bold ${theme.textPrimary}`}>
                Total Amount:
              </span>
              <span className={`text-xl font-bold ${theme.textPrimary}`}>
                PKR {batchData.overallPrice}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Medicine Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className={`${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
      >
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
            <div>
              <h2
                className={`text-xl sm:text-2xl font-bold ${theme.textPrimary} mb-2`}
              >
                Medicine Details
              </h2>
              <p className={`${theme.textMuted}`}>
                Complete information about medicines in this batch
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
              />
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={handleSearch}
                className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
              />
            </div>
          </div>

          {/* Medicine Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${theme.borderSecondary} border-b`}>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium cursor-pointer"
                    onClick={() => requestSort("medicineName")}
                  >
                    <div
                      className={`flex items-center ${theme.textMuted} tracking-wider`}
                    >
                      <span>Medicine Name</span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-medium cursor-pointer"
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
                    className="px-4 py-3 text-center text-xs font-medium cursor-pointer"
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
                    className="px-4 py-3 text-center text-xs font-medium cursor-pointer"
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
                    className="px-4 py-3 text-center text-xs font-medium cursor-pointer"
                    onClick={() => requestSort("expiryDate")}
                  >
                    <div
                      className={`flex items-center justify-center ${theme.textMuted} tracking-wider`}
                    >
                      <span>Expiry Date</span>
                      <ArrowDownUp className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  {/* <th className={`px-4 py-3 text-center text-xs font-medium ${theme.textMuted} tracking-wider`}>
                    Status
                  </th> */}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedMedicines.map((medicine, index) => {
                  const medicineStatus = getMedicineStatus(medicine);
                  return (
                    <motion.tr
                      key={medicine._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`${theme.borderSecondary} border-b hover:bg-opacity-50 ${theme.cardSecondary} transition-colors`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div
                            className={`w-10 h-10 rounded-full ${theme.cardSecondary} flex items-center justify-center mr-3`}
                          >
                            <Pill className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div>
                            <div
                              className={`font-medium ${theme.textPrimary} text-sm sm:text-base`}
                            >
                              {medicine.medicineName}
                            </div>
                            {/* <div className={`text-xs ${theme.textMuted}`}>
                              Reorder Level: {medicine.reorderLevel}
                            </div> */}
                          </div>
                        </div>
                      </td>
                      <td
                        className={`px-4 py-4 text-center text-sm ${theme.textSecondary}`}
                      >
                        <span
                          className={
                            medicine.quantity <= medicine.reorderLevel
                              ? "text-red-500"
                              : "text-green-500"
                          }
                        >
                          {medicine.quantity} units
                        </span>
                      </td>
                      <td
                        className={`px-4 py-4 text-center text-sm ${theme.textSecondary}`}
                      >
                        PKR {medicine.price}
                      </td>
                      <td
                        className={`px-4 py-4 text-center text-sm font-semibold ${theme.textPrimary}`}
                      >
                        PKR {medicine.totalAmount}
                      </td>
                      <td
                        className={`px-4 py-4 text-center text-sm ${theme.textSecondary}`}
                      >
                        <div className="flex flex-col items-center">
                          <span>{formatDate(medicine.expiryDate)}</span>
                          <span className="text-xs text-gray-500">
                            (
                            {Math.ceil(
                              (new Date(medicine.expiryDate) - new Date()) /
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
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredAndSortedMedicines.length === 0 && (
            <div className="text-center py-12">
              <Pill className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`} />
              <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
                {searchTerm
                  ? `No medicines found matching "${searchTerm}"`
                  : "No medicines found"}
              </h3>
              <p className={`${theme.textMuted}`}>
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "This batch appears to be empty"}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Attachments Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className={`${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border my-8`}
      >
        <div className="p-4 sm:p-6">
          <h2
            className={`text-xl sm:text-2xl font-bold ${theme.textPrimary} mb-4`}
          >
            Attachments
          </h2>
          {batchData.attachments?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {batchData.attachments.map((attachment, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedAttachments(batchData.attachments);
                    setCurrentAttachmentIndex(index);
                    setAttachmentModalOpen(true);
                  }}
                >
                  <img
                    src={attachment}
                    alt={`Attachment ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg border"
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package
                className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`}
              />
              <p className={`${theme.textMuted}`}>
                No attachments found for this batch
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Attachment Modal */}
      <Modal
        isOpen={attachmentModalOpen}
        onClose={() => setAttachmentModalOpen(false)}
        title="Batch Attachments"
        subtitle={`${currentAttachmentIndex + 1} of ${
          selectedAttachments.length
        }`}
      >
        <div className="relative w-full h-96 flex items-center justify-center">
          {selectedAttachments.length > 0 ? (
            <>
              <img
                src={selectedAttachments[currentAttachmentIndex]}
                alt={`Attachment ${currentAttachmentIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />

              {/* Navigation buttons */}
              {selectedAttachments.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentAttachmentIndex(
                        (prev) =>
                          (prev - 1 + selectedAttachments.length) %
                          selectedAttachments.length
                      );
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentAttachmentIndex(
                        (prev) => (prev + 1) % selectedAttachments.length
                      );
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Dots indicator */}
              {selectedAttachments.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                  {selectedAttachments.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentAttachmentIndex(index);
                      }}
                      className={`w-3 h-3 rounded-full ${
                        index === currentAttachmentIndex
                          ? "bg-blue-500"
                          : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-500">No attachments to display</div>
          )}
        </div>
      </Modal>

      {logsModalOpen && (
        <BatchActivityLogsModal
          isOpen={logsModalOpen}
          onClose={() => setLogsModalOpen(false)}
          batchNumber={batchData.batchNumber}
          batchId={batchId}
        />
      )}


    </div>
  );
};

export default BatchByID;
