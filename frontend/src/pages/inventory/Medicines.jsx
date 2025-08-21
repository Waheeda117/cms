import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Pill,
  AlertCircle,
  X,
  Check,
  Upload,
  FileText,
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import {
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  addBulkMedicines,
} from "../../api/api";
import Pagination from "../../components/UI/Pagination.jsx";
import Modal from "../../components/UI/Modal.jsx";
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

  // Bulk upload states (unchanged)
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState("");
  const [bulkMedicines, setBulkMedicines] = useState([]);
  const [bulkValidationErrors, setBulkValidationErrors] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginationData, setPaginationData] = useState(null);

  const { user } = useAuthStore();

  // Dropdown options
  const strengthOptions = ["100mg", "400mg", "600mg", "1g"];
  const categoryOptions = ["Tab", "Syp", "Drop", "Inj", "Ointment"];

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
        return "";

      case "category":
        if (!value || value.trim().length === 0) {
          return "Category is required";
        }
        return "";

      case "description":
        if (value && !/^[a-zA-Z0-9 ]*$/.test(value)) {
          return "Only alphabets, digits and spaces are allowed";
        }
        if (value && value.length > 50) {
          return "Description cannot exceed 50 characters";
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

  // Reset bulk modal states (unchanged)
  const resetBulkModalStates = () => {
    setCsvFile(null);
    setCsvData("");
    setBulkMedicines([]);
    setBulkValidationErrors([]);
    setBulkResults(null);
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

  // Bulk medicine validation (for medicine name only - unchanged)
  const validateMedicineName = (name) => {
    const regex = /^[a-zA-Z0-9 ]*$/;
    if (!regex.test(name)) {
      return "Only alphabets and numbers are allowed";
    }
    if (name.length > 50) {
      return "Medicine name cannot exceed 50 characters";
    }
    if (name.trim().length === 0) {
      return "Medicine name is required";
    }
    return "";
  };

  // Handle CSV file upload (unchanged)
  const handleCsvFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setApiError("Please select a CSV file");
      return;
    }

    setCsvFile(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target.result;
      setCsvData(text);
      parseCsvData(text);
    };

    reader.readAsText(file);
  };

  // Parse CSV data (unchanged)
  const parseCsvData = (csvText) => {
    try {
      const lines = csvText.split("\n").filter((line) => line.trim());
      const medicines = [];
      const errors = [];

      lines.forEach((line, index) => {
        const name = line.trim().replace(/[",]/g, "");

        if (name) {
          const validationError = validateMedicineName(name);
          if (validationError) {
            errors.push(`Line ${index + 1}: ${validationError}`);
          } else {
            medicines.push({ name: name.trim() });
          }
        }
      });

      setBulkMedicines(medicines);
      setBulkValidationErrors(errors);
      setApiError("");
    } catch (error) {
      setApiError("Failed to parse CSV file");
    }
  };

  // Handle CSV data change in textarea (unchanged)
  const handleCsvDataChange = (value) => {
    setCsvData(value);
    parseCsvData(value);
  };

  // Handle bulk medicine submission (unchanged)
  const handleBulkSubmit = async () => {
    if (bulkMedicines.length === 0) {
      setApiError("No valid medicines to add");
      return;
    }

    if (bulkValidationErrors.length > 0) {
      setApiError("Please fix validation errors before submitting");
      return;
    }

    setBulkLoading(true);
    try {
      const response = await addBulkMedicines({ medicines: bulkMedicines });
      setBulkResults(response.data.data);
      fetchData();
    } catch (err) {
      setApiError(
        err.response?.data?.message || "Failed to add bulk medicines"
      );
    } finally {
      setBulkLoading(false);
    }
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

  // Handle delete medicine (unchanged)
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

  // Open delete confirmation modal (unchanged)
  const openDeleteModal = (medicine) => {
    setSelectedMedicine(medicine);
    resetModalStates();
    setIsDeleteModalOpen(true);
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
                onClick={() => {
                  setIsBulkModalOpen(true);
                  resetBulkModalStates();
                }}
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
            <table className="w-full">
              <thead>
                <tr className={`${theme.borderSecondary} border-b`}>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    <span className={`${theme.textMuted}`}>Medicine ID</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    <span className={`${theme.textMuted}`}>Name</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    <span className={`${theme.textMuted}`}>Strength</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    <span className={`${theme.textMuted}`}>Category</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    <span className={`${theme.textMuted}`}>Description</span>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full ${theme.cardSecondary} flex items-center justify-center mr-3`}
                        >
                          <Pill className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className={`font-medium ${theme.textPrimary}`}>
                          {medicine.medicineId}
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${theme.textSecondary}`}>
                      <div className="max-w-xs">
                        <div className="font-medium truncate">
                          {medicine.name}
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${theme.textSecondary}`}>
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
                    <td className={`px-6 py-4 text-sm ${theme.textSecondary}`}>
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
                    <td className={`px-6 py-4 text-sm ${theme.textSecondary}`}>
                      <div className="max-w-xs">
                        <div className="truncate" title={medicine.description}>
                          {medicine.description || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${theme.textSecondary}`}>
                      <div className="max-w-xs">
                        <div className="truncate" title={medicine.manufacturer}>
                          {medicine.manufacturer || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    onClick={() => {
                      setIsBulkModalOpen(true);
                      resetBulkModalStates();
                    }}
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
              <select
                value={addForm.strength}
                onChange={(e) =>
                  handleAddFormChange("strength", e.target.value)
                }
                className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary}`}
              >
                <option value="">Select strength</option>
                {strengthOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
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
                Category *
              </label>
              <select
                value={addForm.category}
                onChange={(e) =>
                  handleAddFormChange("category", e.target.value)
                }
                className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary}`}
              >
                <option value="">Select category</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
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
              Description *
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

      {/* Bulk Upload Modal (unchanged) */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => {
          setIsBulkModalOpen(false);
          resetBulkModalStates();
        }}
        title="Add Bulk Medicines"
        subtitle="Upload CSV file with medicine names"
      >
        <div className="p-6">
          {!bulkResults ? (
            <>
              {/* File Upload Section */}
              <div className="mb-6">
                <label
                  className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
                >
                  Upload CSV File *
                </label>
                <div
                  className={`border-2 border-dashed ${theme.borderSecondary} rounded-lg p-6 text-center`}
                >
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className={`cursor-pointer flex flex-col items-center space-y-2 ${theme.textPrimary}`}
                  >
                    <FileText className="w-12 h-12 text-purple-500" />
                    <span className="text-sm font-medium">
                      {csvFile ? csvFile.name : "Click to upload CSV file"}
                    </span>
                    <span className={`text-xs ${theme.textMuted}`}>
                      CSV file should contain medicine names, one per line
                    </span>
                  </label>
                </div>
              </div>

              {/* Preview Section */}
              {csvData && (
                <div className="mb-6">
                  <label
                    className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
                  >
                    Preview & Edit Medicine Names
                  </label>
                  <textarea
                    value={csvData}
                    onChange={(e) => handleCsvDataChange(e.target.value)}
                    rows={10}
                    className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} font-mono text-sm`}
                    placeholder="Medicine names will appear here..."
                  />
                  <p className="text-green-500 text-xs mt-1">
                    * Only alphabets and digits are allowed, No special
                    characters & max length is 50 characters per name
                  </p>
                </div>
              )}

              {/* Validation Errors */}
              {bulkValidationErrors.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-red-500 font-medium mb-2">
                    Validation Errors:
                  </h4>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-32 overflow-y-auto">
                    {bulkValidationErrors.map((error, index) => (
                      <p
                        key={index}
                        className="text-red-600 dark:text-red-400 text-sm"
                      >
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {bulkMedicines.length > 0 && (
                <div className="mb-6">
                  <div
                    className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4`}
                  >
                    <p className={`text-blue-700 dark:text-blue-300 text-sm`}>
                      Ready to add {bulkMedicines.length} medicine(s)
                      {bulkValidationErrors.length > 0 && (
                        <span className="text-red-600 dark:text-red-400">
                          {" "}
                          ({bulkValidationErrors.length} error(s) need to be
                          fixed)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {apiError && (
                <div className="mb-6">
                  <p className="text-red-500 text-sm">{apiError}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setIsBulkModalOpen(false);
                    resetBulkModalStates();
                  }}
                  className={`px-4 py-2 ${theme.cardSecondary} ${theme.borderSecondary} border rounded-lg ${theme.textPrimary}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkSubmit}
                  disabled={
                    bulkMedicines.length === 0 ||
                    bulkValidationErrors.length > 0 ||
                    bulkLoading
                  }
                  className={`px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-purple-700 transition-all duration-200`}
                >
                  {bulkLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    `Add ${bulkMedicines.length} Medicines`
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Results Section */
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4">
                  {bulkResults.successCount > 0 ? (
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-500" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                  )}
                </div>
                <h3
                  className={`text-lg font-semibold ${theme.textPrimary} mb-2`}
                >
                  Bulk Upload Complete
                </h3>
                <p className={`${theme.textMuted}`}>
                  Processed {bulkResults.totalProcessed} medicine(s)
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {bulkResults.successCount}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Success
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {bulkResults.duplicateCount}
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    Duplicates
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {bulkResults.failedCount}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">
                    Failed
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              {(bulkResults.results.duplicates.length > 0 ||
                bulkResults.results.failed.length > 0) && (
                <div className="space-y-4">
                  {/* Duplicates */}
                  {bulkResults.results.duplicates.length > 0 && (
                    <div>
                      <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                        Duplicate Medicines (
                        {bulkResults.results.duplicates.length})
                      </h4>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-h-32 overflow-y-auto">
                        {bulkResults.results.duplicates.map((item, index) => (
                          <p
                            key={index}
                            className="text-yellow-700 dark:text-yellow-300 text-sm"
                          >
                            {item.name} - {item.error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Failed */}
                  {bulkResults.results.failed.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
                        Failed Medicines ({bulkResults.results.failed.length})
                      </h4>
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-32 overflow-y-auto">
                        {bulkResults.results.failed.map((item, index) => (
                          <p
                            key={index}
                            className="text-red-700 dark:text-red-300 text-sm"
                          >
                            {item.name} - {item.error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setIsBulkModalOpen(false);
                    resetBulkModalStates();
                  }}
                  className={`px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-lg`}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

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
              <select
                value={editForm.strength}
                onChange={(e) =>
                  handleEditFormChange("strength", e.target.value)
                }
                className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary}`}
              >
                <option value="">Select strength</option>
                {strengthOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
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
                Category *
              </label>
              <select
                value={editForm.category}
                onChange={(e) =>
                  handleEditFormChange("category", e.target.value)
                }
                className={`w-full px-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary}`}
              >
                <option value="">Select category</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
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
              Description *
            </label>
            <input
              type="text"
              value={editForm.description}
              onChange={(e) =>
                handleEditFormChange("description", e.target.value)
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
    </div>
  );
};

export default Medicines;
