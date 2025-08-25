import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Pill,
  AlertCircle,
  Upload,
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import {
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
} from "../../api/api";
import Pagination from "../../components/UI/Pagination.jsx";
import Modal from "../../components/UI/Modal.jsx";
import AddBulkMedicine from "../../components/inventory/AddBulkMedicine.jsx";
import AddBulkMedicineResults from "../../components/inventory/AddBulkMedicineResults.jsx";
import { useAuthStore } from "../../store/authStore";

const Medicines = () => {
  const { theme } = useTheme();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [bulkResults, setBulkResults] = useState(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);

  // Add Medicine Form State
  const [addForm, setAddForm] = useState({
    name: "",
    strength: "",
    category: "",
    description: "",
    manufacturer: "",
  });

  // Edit Medicine Form State
  const [editForm, setEditForm] = useState({
    name: "",
    strength: "",
    category: "",
    description: "",
    manufacturer: "",
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginationData, setPaginationData] = useState(null);

  const { user } = useAuthStore();

  // Fetch medicines data
  const fetchData = async (page = currentPage, limit = itemsPerPage) => {
    try {
      setLoading(true);
      const response = await getMedicines(page, limit);
      setMedicines(response.data.data.medicines);
      setPaginationData(response.data.data.pagination);
      setError(null);
    } catch (err) {
      setError("Failed to fetch medicines data");
      console.error("Error fetching medicines:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  // Client-side search filtering (excluding medicine with ID 1)
  const filteredMedicines = useMemo(() => {
    if (!medicines) return [];

    // Filter out medicine with ID 1
    const filtered = medicines.filter((medicine) => medicine.medicineId !== 1);

    if (!searchTerm) return filtered;

    const lowerSearch = searchTerm.toLowerCase();
    return filtered.filter(
      (medicine) =>
        medicine.name.toLowerCase().includes(lowerSearch) ||
        medicine.medicineId.toString().includes(lowerSearch) ||
        (medicine.description &&
          medicine.description.toLowerCase().includes(lowerSearch)) ||
        (medicine.category &&
          medicine.category.toLowerCase().includes(lowerSearch)) ||
        (medicine.strength &&
          medicine.strength.toLowerCase().includes(lowerSearch)) ||
        (medicine.manufacturer &&
          medicine.manufacturer.toLowerCase().includes(lowerSearch))
    );
  }, [medicines, searchTerm]);

  // Validation functions
  const validateField = (field, value) => {
    switch (field) {
      case "name":
        if (!value || value.trim().length === 0) {
          return "Medicine name is required";
        }
        if (!/^[a-zA-Z0-9 ]*$/.test(value)) {
          return "Only alphabets, digits and spaces are allowed";
        }
        if (value.length > 50) {
          return "Medicine name cannot exceed 50 characters";
        }
        return "";

      case "strength":
        if (!value || value.trim().length === 0) {
          return "Strength is required";
        }
        if (!/^[a-zA-Z0-9 ]*$/.test(value)) {
          return "Only alphabets, digits and spaces are allowed";
        }
        if (value.length > 10) {
          return "Strength cannot exceed 10 characters";
        }
        return "";

      case "category":
        if (!value || value.trim().length === 0) {
          return "Type is required";
        }
        if (!/^[a-zA-Z0-9 ]*$/.test(value)) {
          return "Only alphabets, digits and spaces are allowed";
        }
        if (value.length > 10) {
          return "Type cannot exceed 10 characters";
        }
        return "";

      case "description":
        if (value && !/^[a-zA-Z0-9 ]*$/.test(value)) {
          return "Only alphabets, digits and spaces are allowed";
        }
        if (value && value.length > 50) {
          return "Formula cannot exceed 50 characters";
        }
        return "";

      case "manufacturer":
        if (value && !/^[a-zA-Z0-9 ]*$/.test(value)) {
          return "Only alphabets, digits and spaces are allowed";
        }
        if (value && value.length > 30) {
          return "Manufacturer cannot exceed 30 characters";
        }
        return "";

      default:
        return "";
    }
  };

  // Validate entire form
  const validateForm = (formData) => {
    const errors = {};
    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) errors[field] = error;
    });
    return errors;
  };

  // Check if form is valid
  const isFormValid = (formData, errors) => {
    return (
      formData.name.trim().length > 0 &&
      formData.strength.trim().length > 0 &&
      formData.category.trim().length > 0 &&
      formData.description.trim().length > 0 &&
      formData.manufacturer.trim().length > 0 &&
      Object.keys(errors).length === 0
    );
  };

  // Reset all modal states
  const resetModalStates = () => {
    setAddForm({
      name: "",
      strength: "",
      category: "",
      description: "",
      manufacturer: "",
    });
    setEditForm({
      name: "",
      strength: "",
      category: "",
      description: "",
      manufacturer: "",
    });
    setValidationErrors({});
    setApiError("");
  };

  // Handle form input changes
  const handleAddFormChange = (field, value) => {
    setAddForm((prev) => ({ ...prev, [field]: value }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    setApiError("");
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    setApiError("");
  };

  // Handle add medicine
  const handleAddMedicine = async () => {
    const errors = validateForm(addForm);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const medicineData = {
        name: addForm.name.trim(),
        strength: addForm.strength,
        category: addForm.category,
        description: addForm.description.trim(),
        manufacturer: addForm.manufacturer.trim(),
      };

      await addMedicine(medicineData);
      setIsAddModalOpen(false);
      resetModalStates();
      fetchData();
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to add medicine");
      console.error("Error adding medicine:", err);
    }
  };

  // Handle edit medicine
  const handleEditMedicine = async () => {
    const errors = validateForm(editForm);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const medicineData = {
        name: editForm.name.trim(),
        strength: editForm.strength,
        category: editForm.category,
        description: editForm.description.trim(),
        manufacturer: editForm.manufacturer.trim(),
      };

      await updateMedicine(selectedMedicine.medicineId, medicineData);
      setIsEditModalOpen(false);
      resetModalStates();
      setSelectedMedicine(null);
      fetchData();
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to update medicine");
      console.error("Error updating medicine:", err);
    }
  };

  // Handle delete medicine
  const handleDeleteMedicine = async () => {
    try {
      await deleteMedicine(selectedMedicine.medicineId);
      setIsDeleteModalOpen(false);
      setSelectedMedicine(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete medicine");
      console.error("Error deleting medicine:", err);
      setIsDeleteModalOpen(false);
    }
  };

  // Open edit modal with pre-populated data
  const openEditModal = (medicine) => {
    setSelectedMedicine(medicine);
    setEditForm({
      name: medicine.name || "",
      strength: medicine.strength || "",
      category: medicine.category || "",
      description: medicine.description || "",
      manufacturer: medicine.manufacturer || "",
    });
    // Don't call resetModalStates() here as it will clear the form
    setValidationErrors({});
    setApiError("");
    setIsEditModalOpen(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (medicine) => {
    setSelectedMedicine(medicine);
    resetModalStates();
    setIsDeleteModalOpen(true);
  };

  const handleBulkSuccess = (results) => {
    // Set results and show results modal
    setBulkResults(results);
    setIsResultsModalOpen(true);
    // Refresh the medicine list
    fetchData();
  };

  // Add this function to handle results modal close
  const handleResultsModalClose = () => {
    setIsResultsModalOpen(false);
    setBulkResults(null);
  };

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
          Medicines Management
        </h1>
        <p className={`${theme.textMuted}`}>Manage your medicine inventory</p>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
      >
        <div className="p-6">
          {/* Header with Add Buttons */}
          <div className="flex flex-col sm:flex-row gap-5 justify-between items-start mb-6">
            <div>
              <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>
                Medicines List
              </h2>
              <p className={`${theme.textMuted}`}>
                View and manage all medicines
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsBulkModalOpen(true)}
                className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200`}
              >
                <Upload className="w-5 h-5" />
                <span>Add Bulk Medicines</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsAddModalOpen(true);
                  resetModalStates();
                }}
                className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200`}
              >
                <Plus className="w-5 h-5" />
                <span>Add Medicine</span>
              </motion.button>
            </div>
          </div>

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}
              />
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[18%]" />{" "}
                {/* Name - wider for longer names */}
                <col className="w-[18%]" /> {/* Strength */}
                <col className="w-[18%]" /> {/* Type */}
                <col className="w-[18%]" />{" "}
                {/* Formula - wider for longer descriptions */}
                <col className="w-[18%]" /> {/* Manufacturer */}
                <col className="w-[10%]" /> {/* Actions */}
              </colgroup>
              <thead>
                <tr className={`${theme.borderSecondary} border-b`}>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    <span className={`${theme.textMuted}`}>Name</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    <span className={`${theme.textMuted}`}>Strength</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    <span className={`${theme.textMuted}`}>Type</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    <span className={`${theme.textMuted}`}>Formula</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    <span className={`${theme.textMuted}`}>Manufacturer</span>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    <span className={`${theme.textMuted}`}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMedicines.map((medicine) => (
                  <tr
                    key={medicine._id}
                    className={`${theme.borderSecondary} border-b hover:bg-opacity-50 ${theme.cardSecondary} transition-colors`}
                  >
                    <td className={`px-6 py-4 ${theme.textSecondary}`}>
                      <div className="flex items-center">
                        <div className="font-medium break-words min-w-0">
                          {medicine.name}
                        </div>
                      </div>
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${theme.textSecondary} align-center`}
                    >
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          medicine.strength
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                        }`}
                      >
                        {medicine.strength || "N/A"}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${theme.textSecondary} align-center`}
                    >
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          medicine.category
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                        }`}
                      >
                        {medicine.category || "N/A"}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${theme.textSecondary} align-center`}
                    >
                      <div className="break-words min-w-0">
                        {medicine.description || "N/A"}
                      </div>
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${theme.textSecondary} align-center`}
                    >
                      <div className="break-words min-w-0">
                        {medicine.manufacturer || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap align-center">
                      <div className="flex justify-center items-center space-x-2">
                        {/* Don't show edit/delete for medicine with ID 1 */}
                        {medicine.medicineId !== 1 && (
                          <>
                            <button
                              className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
                              onClick={() => openEditModal(medicine)}
                            >
                              <Edit className="w-4 h-4 text-blue-500" />
                            </button>
                            <button
                              className={`p-1.5 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
                              onClick={() => openDeleteModal(medicine)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredMedicines.length === 0 && (
            <div className="text-center py-12">
              <Pill className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`} />
              <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
                {searchTerm
                  ? `No medicines found matching "${searchTerm}"`
                  : "No medicines found"}
              </h3>
              <p className={`${theme.textMuted} mb-4`}>
                {searchTerm
                  ? "Try adjusting your search terms or clear the search to see all medicines"
                  : "Get started by adding your first medicine"}
              </p>
              {!searchTerm && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setIsBulkModalOpen(true)}
                    className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 mx-auto`}
                  >
                    <Upload className="w-5 h-5" />
                    <span>Add Bulk Medicines</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsAddModalOpen(true);
                      resetModalStates();
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200 mx-auto`}
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Medicine</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
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
              setCurrentPage(1);
            }}
          />
        )}
      </motion.div>

      {/* Add Medicine Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddForm({
            name: "",
            strength: "",
            category: "",
            description: "",
            manufacturer: "",
          });
          setValidationErrors({});
          setApiError("");
        }}
        title="Add New Medicine"
      >
        <div className="p-6 space-y-4">
          {/* First Row: Medicine Name and Strength */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Medicine Name */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
              >
                Medicine Name *
              </label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => handleAddFormChange("name", e.target.value)}
                className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary}`}
                placeholder="Enter medicine name"
                maxLength={50}
              />
              {validationErrors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.name}
                </p>
              )}
            </div>

            {/* Strength */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
              >
                Strength *
              </label>
              <input
                type="text"
                value={addForm.strength}
                onChange={(e) =>
                  handleAddFormChange("strength", e.target.value)
                }
                className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary}`}
                placeholder="Enter strength"
                maxLength={10}
              />
              {validationErrors.strength && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.strength}
                </p>
              )}
            </div>
          </div>

          {/* Second Row: Category and Manufacturer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
              >
                Type *
              </label>
              <input
                type="text"
                value={addForm.category}
                onChange={(e) =>
                  handleAddFormChange("category", e.target.value)
                }
                className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary}`}
                placeholder="Enter type"
                maxLength={10}
              />
              {validationErrors.category && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.category}
                </p>
              )}
            </div>

            {/* Manufacturer */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
              >
                Manufacturer *
              </label>
              <input
                type="text"
                value={addForm.manufacturer}
                onChange={(e) =>
                  handleAddFormChange("manufacturer", e.target.value)
                }
                className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary}`}
                placeholder="Enter manufacturer name"
                maxLength={30}
              />
              {validationErrors.manufacturer && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.manufacturer}
                </p>
              )}
            </div>
          </div>

          {/* Third Row: Description */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Formula *
            </label>
            <input
              type="text"
              value={addForm.description}
              onChange={(e) =>
                handleAddFormChange("description", e.target.value)
              }
              className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary}`}
              placeholder="Enter description"
              maxLength={50}
            />
            {validationErrors.description && (
              <p className="text-red-500 text-xs mt-1">
                {validationErrors.description}
              </p>
            )}
          </div>

          {/* API Error */}
          {apiError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 text-sm">
                {apiError}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                resetModalStates();
              }}
              className={`px-4 py-2 ${theme.cardSecondary} ${theme.borderSecondary} border rounded-lg ${theme.textPrimary}`}
            >
              Cancel
            </button>
            <button
              onClick={handleAddMedicine}
              disabled={!isFormValid(addForm, validationErrors)}
              className={`px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Add Medicine
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Upload Modal - New Component */}
      <AddBulkMedicine
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={handleBulkSuccess}
      />

      {/* Edit Medicine Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditForm({
            name: "",
            strength: "",
            category: "",
            description: "",
            manufacturer: "",
          });
          setValidationErrors({});
          setApiError("");
          setSelectedMedicine(null);
        }}
        title="Edit Medicine"
      >
        <div className="p-6 space-y-4">
          {/* First Row: Medicine Name and Strength */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Medicine Name */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
              >
                Medicine Name *
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => handleEditFormChange("name", e.target.value)}
                className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary}`}
                placeholder="Enter medicine name"
                maxLength={50}
              />
              {validationErrors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.name}
                </p>
              )}
            </div>

            {/* Strength */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
              >
                Strength *
              </label>
              <input
                type="text"
                value={editForm.strength}
                onChange={(e) =>
                  handleEditFormChange("strength", e.target.value)
                }
                className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary}`}
                placeholder="Enter strength"
                maxLength={10}
              />
              {validationErrors.strength && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.strength}
                </p>
              )}
            </div>
          </div>

          {/* Second Row: Category and Manufacturer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
              >
                Type *
              </label>
              <input
                type="text"
                value={editForm.category}
                onChange={(e) =>
                  handleEditFormChange("category", e.target.value)
                }
                className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary}`}
                placeholder="Enter type"
                maxLength={10}
              />
              {validationErrors.category && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.category}
                </p>
              )}
            </div>

            {/* Manufacturer */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
              >
                Manufacturer *
              </label>
              <input
                type="text"
                value={editForm.manufacturer}
                onChange={(e) =>
                  handleEditFormChange("manufacturer", e.target.value)
                }
                className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary}`}
                placeholder="Enter manufacturer name"
                maxLength={30}
              />
              {validationErrors.manufacturer && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.manufacturer}
                </p>
              )}
            </div>
          </div>

          {/* Third Row: Description */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
            >
              Formula *
            </label>
            <input
              type="text"
              value={editForm.description}
              onChange={(e) =>
                handleEditFormChange("description", e.target.value)
              }
              className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary}`}
              placeholder="Enter formula"
              maxLength={50}
            />
            {validationErrors.description && (
              <p className="text-red-500 text-xs mt-1">
                {validationErrors.description}
              </p>
            )}
          </div>

          {/* API Error */}
          {apiError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 text-sm">
                {apiError}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                resetModalStates();
                setSelectedMedicine(null);
              }}
              className={`px-4 py-2 ${theme.cardSecondary} ${theme.borderSecondary} border rounded-lg ${theme.textPrimary}`}
            >
              Cancel
            </button>
            <button
              onClick={handleEditMedicine}
              disabled={!isFormValid(editForm, validationErrors)}
              className={`px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Update Medicine
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedMedicine(null);
        }}
        title="Confirm Deletion"
      >
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <p className={`text-center ${theme.textSecondary}`}>
              Are you sure you want to delete the medicine "
              {selectedMedicine?.name}"? This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedMedicine(null);
              }}
              className={`px-4 py-2 ${theme.cardSecondary} ${theme.borderSecondary} border rounded-lg ${theme.textPrimary}`}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteMedicine}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700"
            >
              Delete Medicine
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Results Modal */}
      <AddBulkMedicineResults
        isOpen={isResultsModalOpen}
        onClose={handleResultsModalClose}
        results={bulkResults}
      />
    </div>
  );
};

export default Medicines;
